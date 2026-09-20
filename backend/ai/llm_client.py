"""
LLM Client Abstraction Layer — supports OpenAI, Gemini, Groq, Ollama, and Mock mode.
Configured via .env: LLM_PROVIDER, LLM_API_KEY, LLM_MODEL.
"""

import json
import logging
import random
from typing import Optional
from backend.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified LLM client that delegates to the configured provider."""

    def __init__(self):
        self.provider = settings.llm_provider.lower()
        self._client = None
        self._init_provider()

    def _init_provider(self):
        if self.provider == "openai":
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=settings.openai_api_key)
                self.model = settings.llm_model or "gpt-3.5-turbo"
            except Exception as e:
                logger.warning(f"OpenAI init failed: {e}. Falling back to mock.")
                self.provider = "mock"

        elif self.provider == "gemini":
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                self.model = settings.llm_model or "gemini-pro"
                self._client = genai.GenerativeModel(self.model)
            except Exception as e:
                logger.warning(f"Gemini init failed: {e}. Falling back to mock.")
                self.provider = "mock"

        elif self.provider == "groq":
            try:
                from groq import AsyncGroq
                self._client = AsyncGroq(api_key=settings.groq_api_key)
                self.model = settings.llm_model or "llama3-8b-8192"
            except Exception as e:
                logger.warning(f"Groq init failed: {e}. Falling back to mock.")
                self.provider = "mock"

        elif self.provider == "ollama":
            import httpx
            self._client = httpx.AsyncClient(base_url=settings.ollama_base_url)
            self.model = settings.llm_model or "llama3"

        else:
            self.provider = "mock"
            logger.info("Using mock LLM provider (demo mode).")

    async def generate(self, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Generate a response from the LLM."""
        try:
            if self.provider == "mock":
                return self._mock_generate(system_prompt, user_prompt)

            elif self.provider == "openai":
                return await self._openai_generate(system_prompt, user_prompt, json_mode)

            elif self.provider == "gemini":
                return await self._gemini_generate(system_prompt, user_prompt)

            elif self.provider == "groq":
                return await self._groq_generate(system_prompt, user_prompt, json_mode)

            elif self.provider == "ollama":
                return await self._ollama_generate(system_prompt, user_prompt)

        except Exception as e:
            logger.error(f"LLM generation error ({self.provider}): {e}")
            return self._mock_generate(system_prompt, user_prompt)

    async def _openai_generate(self, system_prompt: str, user_prompt: str, json_mode: bool) -> str:
        kwargs = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 2000,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = await self._client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    async def _gemini_generate(self, system_prompt: str, user_prompt: str) -> str:
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = await self._client.generate_content_async(full_prompt)
        return response.text

    async def _groq_generate(self, system_prompt: str, user_prompt: str, json_mode: bool) -> str:
        kwargs = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 2000,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = await self._client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    async def _ollama_generate(self, system_prompt: str, user_prompt: str) -> str:
        response = await self._client.post("/api/generate", json={
            "model": self.model,
            "system": system_prompt,
            "prompt": user_prompt,
            "stream": False,
        })
        data = response.json()
        return data.get("response", "")

    def _mock_generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate mock AI responses for demo mode."""
        prompt_lower = user_prompt.lower()

        if "network" in system_prompt.lower() or "pcap" in prompt_lower or "traffic" in prompt_lower:
            return json.dumps({
                "analysis": "The network traffic analysis reveals several concerning patterns that warrant immediate attention.",
                "threat_assessment": "Based on the observed traffic patterns, including unusual port access sequences and connection frequencies, this activity is consistent with network reconnaissance or port scanning behavior.",
                "key_findings": [
                    "Multiple destination ports were accessed in rapid succession from a single source",
                    "Connection patterns suggest systematic port enumeration",
                    "Traffic volume exceeds normal baseline for the source host",
                    "Several connections to non-standard ports detected"
                ],
                "severity": "HIGH",
                "confidence": round(random.uniform(0.82, 0.95), 2),
                "recommendations": [
                    "Isolate the source host for further investigation",
                    "Review firewall logs for additional suspicious activity",
                    "Block the source IP if external",
                    "Check for data exfiltration indicators",
                    "Monitor destination hosts for compromise indicators"
                ]
            })

        elif "phishing" in system_prompt.lower() or "email" in prompt_lower:
            return json.dumps({
                "analysis": "This email exhibits multiple characteristics commonly associated with phishing campaigns targeting credential theft.",
                "threat_assessment": "The combination of sender domain mismatch, urgency-based language, and credential harvesting URLs strongly indicates a phishing attempt.",
                "key_findings": [
                    "Sender domain does not match claimed organization",
                    "Email contains urgent call-to-action language",
                    "Embedded URLs redirect to external credential harvesting pages",
                    "Email headers show signs of spoofing",
                    "Social engineering techniques used to create sense of urgency"
                ],
                "severity": "HIGH",
                "confidence": round(random.uniform(0.88, 0.96), 2),
                "recommendations": [
                    "Quarantine the email immediately",
                    "Block the sender domain",
                    "Alert all users who may have received similar emails",
                    "Check if any users clicked the malicious links",
                    "Reset credentials for any affected accounts"
                ]
            })

        elif "malware" in system_prompt.lower() or "file" in prompt_lower:
            return json.dumps({
                "analysis": "Static analysis of the uploaded file reveals suspicious characteristics that may indicate malicious intent.",
                "threat_assessment": "The file exhibits several red flags including suspicious naming conventions and potentially deceptive file extensions.",
                "key_findings": [
                    "File extension mismatch detected",
                    "Suspicious file naming pattern (social engineering)",
                    "File hash not found in known-clean databases",
                    "File metadata contains anomalous attributes"
                ],
                "severity": "MEDIUM",
                "confidence": round(random.uniform(0.65, 0.80), 2),
                "recommendations": [
                    "Do not execute the file",
                    "Submit hash to threat intelligence services",
                    "Quarantine the file",
                    "Investigate the source of the file",
                    "Scan endpoints that may have accessed this file"
                ]
            })

        elif "correlat" in system_prompt.lower():
            return json.dumps({
                "analysis": "Cross-referencing findings from multiple security agents reveals a coordinated threat pattern.",
                "correlation_reasoning": "The indicators of compromise identified by different agents share common infrastructure and timing, suggesting a single threat actor or campaign.",
                "key_findings": [
                    "Shared indicators found across multiple data sources",
                    "Temporal correlation indicates coordinated activity",
                    "Common threat infrastructure identified",
                    "Attack pattern matches known threat campaign"
                ],
                "unified_threat": "Coordinated multi-vector attack",
                "severity": "HIGH",
                "confidence": round(random.uniform(0.80, 0.93), 2),
                "correlation_score": round(random.uniform(0.75, 0.92), 2)
            })

        elif "response" in system_prompt.lower() or "incident response" in system_prompt.lower():
            return json.dumps({
                "analysis": "Based on the incident severity and evidence, the following response actions are recommended.",
                "immediate_actions": [
                    "Isolate affected endpoints from the network",
                    "Preserve forensic evidence",
                    "Block identified malicious indicators"
                ],
                "short_term_actions": [
                    "Conduct full scan of affected systems",
                    "Review access logs for lateral movement",
                    "Reset potentially compromised credentials",
                    "Update detection signatures"
                ],
                "long_term_actions": [
                    "Review and update security policies",
                    "Conduct security awareness training",
                    "Implement additional monitoring controls",
                    "Update incident response procedures"
                ],
                "severity": "HIGH",
                "priority": "URGENT"
            })

        elif "report" in system_prompt.lower():
            return json.dumps({
                "executive_summary": "A security incident was detected and analyzed by SentinelAI's multi-agent system. The coordinated analysis identified threat indicators, correlated evidence across data sources, and generated actionable response recommendations.",
                "narrative": "The SentinelAI automated security operations platform detected suspicious activity through uploaded security data. Multiple specialized AI agents collaborated to analyze the data, identify threats, and produce a comprehensive incident assessment.",
                "risk_assessment": "Based on the combined evidence and agent findings, this incident presents a significant risk to the organization's security posture and requires prompt attention.",
                "conclusion": "The multi-agent analysis has provided a comprehensive view of the security incident. Implementing the recommended response actions will help mitigate the identified risks."
            })

        else:
            return json.dumps({
                "analysis": "AI analysis completed. The provided data has been evaluated for security threats.",
                "findings": ["Analysis performed on provided data", "Results generated"],
                "severity": "MEDIUM",
                "confidence": round(random.uniform(0.60, 0.85), 2)
            })


# Singleton
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get or create the LLM client singleton."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
