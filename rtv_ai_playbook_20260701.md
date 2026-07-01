# RotationTV Network
## AI Provider Integration Playbook
### Version 2.0 | Confidential & Proprietary

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║          ROTATIONTV NETWORK — AI PROVIDER INTEGRATION PLAYBOOK              ║
║                    Multi-Provider Architecture Guide                         ║
║                                                                              ║
║  PRIMARY:    Anthropic Claude (claude-sonnet-4-6, claude-opus-4-6)          ║
║  SECONDARY:  Google Gemini (50+ Models)                                      ║
║  MODERATION: Venice AI (Uncensored Pipeline)                                 ║
║  CODE GEN:   Kimi/Moonshot (Pending Credits)                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## TABLE OF CONTENTS

1. [Executive Architecture Overview](#1-executive-architecture-overview)
2. [Anthropic Claude — Primary AI Stack](#2-anthropic-claude--primary-ai-stack)
3. [Google Gemini — Secondary AI Stack](#3-google-gemini--secondary-ai-stack)
4. [Venice AI — Moderation Pipeline](#4-venice-ai--moderation-pipeline)
5. [Kimi/Moonshot — Code Generation](#5-kimimoonshot--code-generation)
6. [Fallback Chain Architecture](#6-fallback-chain-architecture)
7. [Cost Optimization Framework](#7-cost-optimization-framework)
8. [Use Cases Per Company](#8-use-cases-per-company)
9. [API Gateway & Orchestration Layer](#9-api-gateway--orchestration-layer)
10. [Security & Compliance](#10-security--compliance)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Deployment & Environment Config](#12-deployment--environment-config)

---

## 1. EXECUTIVE ARCHITECTURE OVERVIEW

### 1.1 Strategic AI Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ROTATIONTV AI PROVIDER MESH                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AI ORCHESTRATION GATEWAY                          │   │
│  │              (Internal Routing + Load Balancing Layer)               │   │
│  └──────────┬────────────┬──────────────┬──────────────┬───────────────┘   │
│             │            │              │              │                    │
│      PRIMARY│     SECONDARY│    MODERATION│    CODE GEN│                   │
│             ▼            ▼              ▼              ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────────┐     │
│  │  ANTHROPIC   │ │   GOOGLE     │ │  VENICE  │ │  KIMI/MOONSHOT   │     │
│  │   CLAUDE     │ │   GEMINI     │ │    AI    │ │  (PENDING CREDS) │     │
│  │              │ │              │ │          │ │                  │     │
│  │ sonnet-4-6   │ │ 50+ Models   │ │Uncensored│ │  moonshot-v1-8k  │     │
│  │  opus-4-6    │ │ Flash/Pro/   │ │Pipeline  │ │ moonshot-v1-32k  │     │
│  │              │ │ Ultra/Nano   │ │          │ │ moonshot-v1-128k │     │
│  └──────────────┘ └──────────────┘ └──────────┘ └──────────────────┘     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ROTATIONTV SERVICES LAYER                         │   │
│  │  Content│ Scheduling│ Metadata│ User│ Analytics│ Moderation│ DevOps │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Provider Role Matrix

| Provider | Role | Priority | Status | Use Cases |
|----------|------|----------|--------|-----------|
| **Anthropic Claude** | Primary Intelligence | P0 | ✅ Active | Content gen, NLP, reasoning |
| **Google Gemini** | Secondary/Multimodal | P1 | ✅ Active | Video analysis, scale tasks |
| **Venice AI** | Moderation Pipeline | P0 | ✅ Active | Content filtering, NSFW review |
| **Kimi/Moonshot** | Code Generation | P2 | ⏳ Pending Credits | Dev automation, code review |

### 1.3 Decision Flow for Model Selection

```python
# PSEUDOCODE: RotationTV AI Router Decision Tree

def select_provider(request: AIRequest) -> Provider:
    """
    Master routing logic for RotationTV AI requests
    """
    
    # STEP 1: Moderation Check (Always First)
    if request.requires_content_review or request.has_user_generated_content:
        return Route(provider="VENICE_AI", reason="moderation_priority")
    
    # STEP 2: Code Generation Tasks
    if request.task_type in ["code_gen", "code_review", "debugging", "scripts"]:
        if KIMI_CREDITS_AVAILABLE:
            return Route(provider="KIMI_MOONSHOT", reason="code_specialization")
        else:
            return Route(provider="CLAUDE_SONNET", reason="kimi_pending_fallback")
    
    # STEP 3: Multimodal / Video Tasks
    if request.has_video or request.has_image or request.task == "thumbnail_analysis":
        return Route(provider="GEMINI", model="gemini-2.0-flash", reason="multimodal")
    
    # STEP 4: Complex Reasoning / Flagship Tasks
    if request.complexity >= "HIGH" or request.task in ["strategy", "long_form_content"]:
        return Route(provider="CLAUDE_OPUS", model="claude-opus-4-6", reason="flagship")
    
    # STEP 5: Standard Tasks (Cost Optimized)
    return Route(provider="CLAUDE_SONNET", model="claude-sonnet-4-6", reason="default")
```

---

## 2. ANTHROPIC CLAUDE — PRIMARY AI STACK

### 2.1 Provider Configuration

```yaml
# config/providers/anthropic.yaml

anthropic:
  provider_name: "Anthropic"
  role: "PRIMARY"
  priority: 0
  
  # Authentication
  auth:
    method: "api_key_header"
    header_name: "x-api-key"
    env_var: "ANTHROPIC_API_KEY"
    key_rotation_days: 90
    
  # Base Configuration  
  base_url: "https://api.anthropic.com"
  api_version: "2023-06-01"
  
  # Active Models
  models:
    flagship:
      id: "claude-opus-4-6"
      context_window: 200000
      max_output_tokens: 32000
      vision_capable: true
      use_cases: ["complex_reasoning", "long_form_content", "strategy", "editorial"]
      cost_per_1k_input: 0.015
      cost_per_1k_output: 0.075
      
    standard:
      id: "claude-sonnet-4-6"
      context_window: 200000
      max_output_tokens: 16000
      vision_capable: true
      use_cases: ["content_gen", "metadata", "descriptions", "chat", "summaries"]
      cost_per_1k_input: 0.003
      cost_per_1k_output: 0.015
      
  # Rate Limits (Tier 2 assumed)
  rate_limits:
    requests_per_minute: 1000
    tokens_per_minute: 80000
    tokens_per_day: 2500000
    
  # Timeout Configuration
  timeouts:
    connect: 5
    read: 120
    max_retries: 3
    retry_backoff: "exponential"
    retry_delay_base: 1.0
```

### 2.2 API Endpoints Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│              ANTHROPIC CLAUDE — API ENDPOINTS                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BASE URL: https://api.anthropic.com/v1                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MESSAGES API (Primary)                                       │   │
│  │ POST /v1/messages                                            │   │
│  │                                                              │   │
│  │ Headers Required:                                            │   │
│  │   x-api-key: ${ANTHROPIC_API_KEY}                           │   │
│  │   anthropic-version: 2023-06-01                             │   │
│  │   content-type: application/json                            │   │
│  │   anthropic-beta: messages-2023-12-15 (for extended)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STREAMING API                                                │   │
│  │ POST /v1/messages (with stream: true)                        │   │
│  │ Returns: text/event-stream                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MODELS API                                                   │   │
│  │ GET /v1/models                                               │   │
│  │ GET /v1/models/{model_id}                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ BATCHES API (Cost Optimization)                              │   │
│  │ POST /v1/messages/batches                                    │   │
│  │ GET  /v1/messages/batches/{batch_id}                         │   │
│  │ GET  /v1/messages/batches/{batch_id}/results                 │   │
│  │ DEL  /v1/messages/batches/{batch_id}                         │   │
│  │ NOTE: 50% cost reduction on batch requests                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Authentication Implementation

```python
# services/ai/anthropic_client.py

import anthropic
import os
from typing import Optional
from functools import lru_cache
import logging

logger = logging.getLogger("rotationtv.ai.anthropic")

class RotationTVAnthropicClient:
    """
    RotationTV's Anthropic Claude integration client
    Handles both claude-sonnet-4-6 and claude-opus-4-6
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY not found. "
                "Set environment variable or pass api_key parameter."
            )
        
        # Initialize Anthropic client
        self.client = anthropic.Anthropic(
            api_key=self.api_key,
            max_retries=3,
            timeout=anthropic.Timeout(
                connect=5.0,
                read=120.0,
                write=10.0,
                pool=5.0
            )
        )
        
        # Async client for non-blocking operations
        self.async_client = anthropic.AsyncAnthropic(
            api_key=self.api_key,
            max_retries=3,
        )
        
        # Model configuration
        self.models = {
            "flagship": "claude-opus-4-6",
            "standard": "claude-sonnet-4-6",
        }
        
        logger.info("Anthropic client initialized for RotationTV")
    
    def create_message(
        self,
        prompt: str,
        model: str = "claude-sonnet-4-6",
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        stream: bool = False
    ) -> dict:
        """
        Core message creation for RotationTV content tasks
        """
        
        messages = [{"role": "user", "content": prompt}]
        
        kwargs = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": messages,
            "temperature": temperature,
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt
        
        if stream:
            return self._stream_message(**kwargs)
        
        try:
            response = self.client.messages.create(**kwargs)
            
            return {
                "success": True,
                "content": response.content[0].text,
                "model": response.model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                },
                "stop_reason": response.stop_reason,
                "provider": "anthropic"
            }
            
        except anthropic.RateLimitError as e:
            logger.error(f"Anthropic rate limit exceeded: {e}")
            raise
        except anthropic.APIConnectionError as e:
            logger.error(f"Anthropic connection error: {e}")
            raise
        except anthropic.APIStatusError as e:
            logger.error(f"Anthropic API error {e.status_code}: {e.message}")
            raise
    
    def create_content_description(
        self, 
        title: str, 
        genre: str, 
        runtime: str,
        existing_synopsis: Optional[str] = None
    ) -> str:
        """
        RotationTV-specific: Generate show/movie descriptions
        """
        
        system = """You are RotationTV's content strategist. Create compelling, 
        SEO-optimized descriptions for TV and movie content that drive viewer 
        engagement. Keep descriptions concise (150-200 words), engaging, and 
        spoiler-free unless instructed otherwise."""
        
        prompt = f"""Create a viewer description for:
        Title: {title}
        Genre: {genre}
        Runtime: {runtime}
        {f'Existing Synopsis: {existing_synopsis}' if existing_synopsis else ''}
        
        Generate: 1) Short hook (1 sentence), 2) Full description (150-200 words), 
        3) 5 SEO keywords"""
        
        response = self.create_message(
            prompt=prompt,
            system_prompt=system,
            model=self.models["standard"],  # Use Sonnet for cost efficiency
            max_tokens=1024
        )
        
        return response["content"]
    
    def analyze_content_strategy(self, data: dict) -> str:
        """
        RotationTV-specific: Deep strategic analysis using Opus
        """
        
        system = """You are a senior content strategist for RotationTV Network.
        Analyze viewing patterns, content performance, and market trends to 
        provide actionable strategic recommendations."""
        
        prompt = f"""Analyze this content strategy data and provide recommendations:
        {data}
        
        Cover: 1) Content gaps, 2) Acquisition priorities, 
        3) Genre balance, 4) Competitive positioning"""
        
        # Use Opus for complex strategic work
        response = self.create_message(
            prompt=prompt,
            system_prompt=system,
            model=self.models["flagship"],  # Opus for complex reasoning
            max_tokens=8192,
            temperature=0.3  # Lower temperature for analytical tasks
        )
        
        return response["content"]
```

### 2.4 Batch Processing for Cost Optimization

```python
# services/ai/anthropic_batch.py

import anthropic
import json
from typing import List, Dict
import time

class AnthropicBatchProcessor:
    """
    Batch processing for RotationTV's high-volume AI tasks
    50% cost reduction vs real-time API calls
    """
    
    def __init__(self, client: anthropic.Anthropic):
        self.client = client
        
    def create_metadata_batch(
        self, 
        content_items: List[Dict]
    ) -> str:
        """
        Batch generate metadata for multiple content items
        Ideal for: catalog ingestion, bulk content updates
        """
        
        requests = []
        
        for idx, item in enumerate(content_items):
            requests.append({
                "custom_id": f"rotationtv-content-{item['id']}-{idx}",
                "params": {
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 512,
                    "system": "You are RotationTV's metadata specialist. Generate concise, accurate metadata.",
                    "messages": [{
                        "role": "user",
                        "content": f"""Generate metadata for:
                        Title: {item['title']}
                        Type: {item.get('type', 'unknown')}
                        Year: {item.get('year', 'unknown')}
                        
                        Return JSON: {{
                            "short_description": "...",
                            "tags": [...],
                            "content_rating": "...",
                            "mood": "...",
                            "target_audience": "..."
                        }}"""
                    }]
                }
            })
        
        # Submit batch
        batch = self.client.messages.batches.create(requests=requests)
        
        print(f"✅ Batch submitted: {batch.id}")
        print(f"   Items: {len(requests)}")
        print(f"   Status: {batch.processing_status}")
        
        return batch.id
    
    def wait_and_retrieve_batch(
        self, 
        batch_id: str, 
        poll_interval: int = 30
    ) -> List[Dict]:
        """
        Poll batch status and retrieve results when complete
        """
        
        print(f"⏳ Polling batch {batch_id}...")
        
        while True:
            batch = self.client.messages.batches.retrieve(batch_id)
            
            if batch.processing_status == "ended":
                print(f"✅ Batch complete: {batch_id}")
                break
            
            print(f"   Status: {batch.processing_status} | "
                  f"Completed: {batch.request_counts.succeeded} | "
                  f"Pending: {batch.request_counts.processing}")
            
            time.sleep(poll_interval)
        
        # Retrieve results
        results = []
        for result in self.client.messages.batches.results(batch_id):
            if result.result.type == "succeeded":
                results.append({
                    "custom_id": result.custom_id,
                    "content": result.result.message.content[0].text,
                    "usage": {
                        "input_tokens": result.result.message.usage.input_tokens,
                        "output_tokens": result.result.message.usage.output_tokens
                    }
                })
            else:
                results.append({
                    "custom_id": result.custom_id,
                    "error": str(result.result.error),
                    "error_type": result.result.type
                })
        
        return results
```

### 2.5 Claude Model Selection Guide

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               CLAUDE MODEL SELECTION — ROTATIONTV DECISION GUIDE            │
├─────────────────────────────────┬───────────────────────────────────────────┤
│        claude-opus-4-6          │         claude-sonnet-4-6                 │
│         (FLAGSHIP)              │           (STANDARD)                      │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ ✅ Long-form content strategy   │ ✅ Episode descriptions (bulk)            │
│ ✅ Complex script analysis      │ ✅ SEO metadata generation                │
│ ✅ Competitive analysis reports │ ✅ Social media copy                      │
│ ✅ Legal content review         │ ✅ Customer support responses             │
│ ✅ Editorial decision support   │ ✅ Search query understanding             │
│ ✅ Multi-document synthesis     │ ✅ Content categorization                 │
│ ✅ Nuanced content policies     │ ✅ Email marketing copy                   │
│ ✅ Budget/financial analysis    │ ✅ Subtitle summarization                 │
│ ✅ Market research synthesis    │ ✅ Recommendation explanations            │
│ ✅ Brand voice development      │ ✅ Press release drafts                   │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ Context: 200K tokens            │ Context: 200K tokens                      │
│ Output: 32K tokens max          │ Output: 16K tokens max                    │
│ Cost: $15/1M in, $75/1M out     │ Cost: $3/1M in, $15/1M out               │
│ Speed: Slower (complex tasks)   │ Speed: Faster (production default)        │
│ Recommended: < 5% of requests   │ Recommended: ~80% of requests             │
└─────────────────────────────────┴───────────────────────────────────────────┘
```

---

## 3. GOOGLE GEMINI — SECONDARY AI STACK

### 3.1 Provider Configuration

```yaml
# config/providers/gemini.yaml

google_gemini:
  provider_name: "Google Gemini"
  role: "SECONDARY"
  priority: 1
  
  # Authentication Methods
  auth:
    primary_method: "api_key"
    secondary_method: "service_account_oauth2"
    
    api_key:
      env_var: "GOOGLE_
