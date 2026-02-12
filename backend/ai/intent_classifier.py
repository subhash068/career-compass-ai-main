from typing import Dict, Any, Optional, List, Tuple
import re
import json
from .config.ai_settings import AISettings
from .memory.conversation_memory import ConversationMemory
from .skill_similarity import SkillSimilarity
from .evaluation.ai_quality import AIQualityMetrics



class IntentClassifier:
    """
    Advanced NLP-based intent detection for chatbot.
    Phase 3A: Enhanced with embeddings, memory integration, and evaluation.
    """

    # Enhanced intent patterns with more comprehensive keywords
    INTENT_PATTERNS = {
        "career": [
            r"\b(career|job|role|profession|occupation|work|position|vocation)\b",
            r"\b(recommend|suggest|find|match|fit|best|suitable|ideal)\b.*\b(job|role|career|position)\b",
            r"\b(what|which|where).*\b(job|role|career|position)\b",
            r"\b(suitable|appropriate|right|good|perfect|ideal)\b.*\b(career|job|field)\b",
            r"\b(become|work as|job as|pursue)\b.*\b(a|an)\b"
        ],
        "skills": [
            r"\b(skill|skills|ability|abilities|competence|strength|weakness|expertise|proficiency)\b",
            r"\b(what|which|my).*\b(skill|skills|strength|weakness)\b",
            r"\b(assess|assessment|evaluation|evaluate|rate|measure)\b.*\b(skill|skills|ability)\b",
            r"\b(improve|enhance|develop|learn|build|grow)\b.*\b(skill|skills|ability)\b",
            r"\b(good|bad|strong|weak)\b.*\b(at|in|with)\b"
        ],
        "learning": [
            r"\b(learn|learning|study|course|training|education|tutorial|class)\b",
            r"\b(path|plan|roadmap|journey|guide|curriculum)\b.*\b(learn|learning|study)\b",
            r"\b(how|what|where|when).*\b(learn|study|improve|practice|train)\b",
            r"\b(resource|material|tutorial|guide|course|book|video|documentation)\b",
            r"\b(teach|study|practice|train|educate)\b"
        ],
        "assessment": [
            r"\b(assess|assessment|test|quiz|evaluation|evaluate|exam|check)\b",
            r"\b(take|do|complete|start|begin|perform)\b.*\b(assessment|test|quiz|exam)\b",
            r"\b(skill|skills|ability).*\b(assessment|test|quiz|evaluation)\b",
            r"\b(measure|rate|score|grade)\b.*\b(skill|ability)\b"
        ],
        "general": [
            r"\b(help|support|assist|guide|advice|information)\b",
            r"\b(what|how|when|where|why|who)\b",
            r"\b(tell|explain|describe|show|give)\b",
            r"\b(can you|could you|would you)\b",
            r"\b(i need|i want|i'm looking)\b"
        ]
    }

    # Confidence thresholds for different methods
    CONFIDENCE_THRESHOLDS = {
        "high": 0.8,
        "medium": 0.6,
        "low": 0.4
    }

    @staticmethod
    def classify_intent(
        query: str,
        conversation_memory: Optional[ConversationMemory] = None,
        use_embeddings: bool = True
    ) -> Dict[str, Any]:
        """
        Classify user intent using multiple methods with Phase 3A enhancements.
        Returns detailed classification result with confidence and metadata.
        """
        query_lower = query.lower().strip()

        # Method 1: Enhanced pattern matching
        pattern_result = IntentClassifier._classify_with_patterns(query_lower)

        # Method 2: Memory-based context (if available)
        memory_result = IntentClassifier._classify_with_memory(query_lower, conversation_memory)

        # Method 3: Embedding similarity (if enabled)
        embedding_result = {}
        if use_embeddings and AISettings.ENABLE_RAG:
            embedding_result = IntentClassifier._classify_with_embeddings(query_lower)

        # Combine results with weighted voting
        final_result = IntentClassifier._combine_classification_results(
            pattern_result, memory_result, embedding_result
        )

        # Quality evaluation
        quality_eval = AIQualityMetrics.evaluate_ai_response(
            f"Classify intent for: {query}",
            f"Intent: {final_result['intent']}",
            [],  # No retrieved docs
            user_feedback=None
        )

        final_result["quality_evaluation"] = quality_eval
        final_result["method_used"] = "phase_3a_multi_method"

        return final_result

    @staticmethod
    def _classify_with_patterns(query_lower: str) -> Dict[str, Any]:
        """Classify using enhanced regex patterns."""
        scores = {}
        matched_patterns = {}

        for intent, patterns in IntentClassifier.INTENT_PATTERNS.items():
            score = 0
            matches = []

            for pattern in patterns:
                found_matches = re.findall(pattern, query_lower)
                if found_matches:
                    score += len(found_matches)
                    matches.extend(found_matches)

            scores[intent] = score
            matched_patterns[intent] = matches

        # Find best intent
        best_intent = max(scores, key=scores.get)
        confidence = min(scores[best_intent] / 5.0, 1.0) if scores[best_intent] > 0 else 0.0

        return {
            "intent": best_intent if confidence > 0.1 else "general",
            "confidence": confidence,
            "method": "patterns",
            "scores": scores,
            "matched_patterns": matched_patterns
        }

    @staticmethod
    def _classify_with_memory(
        query_lower: str,
        conversation_memory: Optional[ConversationMemory]
    ) -> Dict[str, Any]:
        """Classify using conversation memory context."""
        if not conversation_memory or not AISettings.ENABLE_MEMORY:
            return {"intent": "general", "confidence": 0.0, "method": "memory"}

        # Analyze recent conversation history
        history = conversation_memory.memory.get("conversation_history", [])
        if not history:
            return {"intent": "general", "confidence": 0.0, "method": "memory"}

        # Look for intent patterns in recent interactions
        recent_intents = [conv.get("intent", "general") for conv in history[-5:]]
        intent_counts = {}
        for intent in recent_intents:
            intent_counts[intent] = intent_counts.get(intent, 0) + 1

        # Bias towards recent intents
        most_common_intent = max(intent_counts, key=intent_counts.get)
        confidence = intent_counts[most_common_intent] / len(recent_intents)

        # Check if current query relates to recent topics
        recent_keywords = set()
        for conv in history[-3:]:
            user_query = conv.get("user_query", "").lower()
            recent_keywords.update(user_query.split()[:10])  # First 10 words

        query_keywords = set(query_lower.split()[:10])
        keyword_overlap = len(recent_keywords.intersection(query_keywords))
        context_boost = min(keyword_overlap * 0.1, 0.3)  # Max 30% boost

        return {
            "intent": most_common_intent,
            "confidence": min(confidence + context_boost, 1.0),
            "method": "memory",
            "context_boost": context_boost
        }

    @staticmethod
    def _classify_with_embeddings(query_lower: str) -> Dict[str, Any]:
        """Classify using embedding similarity to intent examples."""
        try:
            from .embeddings.embedding_service import EmbeddingService


            # Example queries for each intent (could be expanded)
            intent_examples = {
                "career": [
                    "what career should I pursue",
                    "recommend a job for me",
                    "which profession fits my skills",
                    "help me find the right career"
                ],
                "skills": [
                    "what are my skills",
                    "how can I improve my skills",
                    "assess my abilities",
                    "what skills do I have"
                ],
                "learning": [
                    "how can I learn this",
                    "create a learning path",
                    "what resources should I use",
                    "help me study this topic"
                ],
                "assessment": [
                    "take a skill assessment",
                    "evaluate my abilities",
                    "test my knowledge",
                    "assess my skills"
                ],
                "general": [
                    "help me please",
                    "what can you do",
                    "tell me about yourself",
                    "how does this work"
                ]
            }

            # Calculate similarity to each intent's examples
            intent_similarities = {}

            for intent, examples in intent_examples.items():
                similarities = SkillSimilarity.compute_similarity(
                    examples, query_lower, top_n=1
                )
                if similarities:
                    intent_similarities[intent] = similarities[0]["similarity"]
                else:
                    intent_similarities[intent] = 0.0

            # Find best matching intent
            best_intent = max(intent_similarities, key=intent_similarities.get)
            confidence = intent_similarities[best_intent]

            return {
                "intent": best_intent,
                "confidence": confidence,
                "method": "embeddings",
                "similarities": intent_similarities
            }

        except Exception:
            # Fallback if embeddings fail
            return {"intent": "general", "confidence": 0.0, "method": "embeddings"}

    @staticmethod
    def _combine_classification_results(
        pattern_result: Dict[str, Any],
        memory_result: Dict[str, Any],
        embedding_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Combine results from multiple classification methods."""
        methods = []
        if pattern_result["confidence"] > 0.1:
            methods.append(("patterns", pattern_result))
        if memory_result["confidence"] > 0.1:
            methods.append(("memory", memory_result))
        if embedding_result.get("confidence", 0) > 0.1:
            methods.append(("embeddings", embedding_result))

        if not methods:
            return {
                "intent": "general",
                "confidence": 0.0,
                "method_used": "fallback",
                "supporting_methods": []
            }

        # Weighted voting based on method reliability
        weights = {
            "patterns": 0.4,      # Reliable for exact matches
            "memory": 0.3,        # Good for context
            "embeddings": 0.3     # Good for semantic understanding
        }

        intent_scores = {}
        total_weight = 0

        for method_name, result in methods:
            weight = weights.get(method_name, 0.2)
            intent = result["intent"]
            confidence = result["confidence"]

            intent_scores[intent] = intent_scores.get(intent, 0) + (weight * confidence)
            total_weight += weight

        # Normalize scores
        if total_weight > 0:
            intent_scores = {k: v / total_weight for k, v in intent_scores.items()}

        # Find winner
        best_intent = max(intent_scores, key=intent_scores.get)
        final_confidence = intent_scores[best_intent]

        return {
            "intent": best_intent,
            "confidence": final_confidence,
            "supporting_methods": [method[0] for method in methods],
            "method_weights": {method[0]: weights.get(method[0], 0.2) for method in methods},
            "intent_scores": intent_scores
        }

    @staticmethod
    def extract_entities(
        query: str,
        intent: str = None,
        conversation_memory: Optional[ConversationMemory] = None
    ) -> Dict[str, Any]:
        """
        Extract relevant entities from the query with enhanced methods.
        """
        entities = {
            "skills": IntentClassifier._extract_skills_enhanced(query, intent, conversation_memory),
            "careers": IntentClassifier._extract_careers_enhanced(query, intent, conversation_memory),
            "levels": IntentClassifier._extract_levels_enhanced(query),
            "topics": IntentClassifier._extract_topics(query),
            "actions": IntentClassifier._extract_actions(query)
        }

        # Quality evaluation
        entities["extraction_quality"] = IntentClassifier._evaluate_entity_extraction(entities, query)

        return entities

    @staticmethod
    def _extract_skills_enhanced(
        query: str,
        intent: str = None,
        conversation_memory: Optional[ConversationMemory] = None
    ) -> List[Dict[str, Any]]:
        """Enhanced skill extraction with context and memory."""
        # Expanded skill keywords
        skill_keywords = [
            # Programming
            "python", "java", "javascript", "typescript", "c++", "c#", "php", "ruby", "go", "rust",
            "react", "angular", "vue", "node", "django", "flask", "spring", "express",
            # Data & ML
            "machine learning", "data science", "artificial intelligence", "deep learning",
            "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "jupyter",
            # Web & Mobile
            "html", "css", "sass", "bootstrap", "tailwind", "web development", "mobile development",
            "ios", "android", "flutter", "react native",
            # Databases
            "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
            # Cloud & DevOps
            "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "ci/cd",
            # Soft skills
            "communication", "leadership", "problem solving", "teamwork", "project management"
        ]

        found_skills = []
        query_lower = query.lower()

        for skill in skill_keywords:
            if skill in query_lower:
                confidence = 1.0
                # Adjust confidence based on context
                if intent == "learning" and "learn" in query_lower:
                    confidence = 0.9  # High confidence for learning context
                elif intent == "skills" and "my skills" in query_lower:
                    confidence = 0.8

                found_skills.append({
                    "name": skill,
                    "confidence": confidence,
                    "context": intent or "general"
                })

        # Add skills from memory if relevant
        if conversation_memory and intent in ["skills", "learning"]:
            recent_skills = []
            for conv in conversation_memory.memory.get("conversation_history", [])[-3:]:
                if "skill" in conv.get("user_query", "").lower():
                    # Extract skills mentioned in recent conversations
                    for skill in skill_keywords:
                        if skill in conv["user_query"].lower() and skill not in [s["name"] for s in found_skills]:
                            found_skills.append({
                                "name": skill,
                                "confidence": 0.6,  # Lower confidence for memory
                                "source": "conversation_memory"
                            })

        return found_skills

    @staticmethod
    def _extract_careers_enhanced(
        query: str,
        intent: str = None,
        conversation_memory: Optional[ConversationMemory] = None
    ) -> List[Dict[str, Any]]:
        """Enhanced career extraction with context."""
        career_keywords = [
            "developer", "engineer", "analyst", "scientist", "designer", "manager",
            "consultant", "architect", "administrator", "specialist", "programmer",
            "researcher", "technician", "coordinator", "director", "lead", "senior",
            "junior", "intern", "trainee", "expert", "guru"
        ]

        found_careers = []
        query_lower = query.lower()

        for career in career_keywords:
            if career in query_lower:
                confidence = 0.8
                if intent == "career":
                    confidence = 0.95  # High confidence in career context

                found_careers.append({
                    "name": career,
                    "confidence": confidence,
                    "context": intent or "general"
                })

        return found_careers

    @staticmethod
    def _extract_levels_enhanced(query: str) -> List[Dict[str, Any]]:
        """Enhanced level extraction."""
        level_keywords = {
            "beginner": ["beginner", "novice", "starter", "newbie", "basic"],
            "intermediate": ["intermediate", "mid-level", "medium", "moderate"],
            "advanced": ["advanced", "expert", "senior", "professional", "experienced"],
            "expert": ["expert", "master", "guru", "specialist", "professional"]
        }

        found_levels = []
        query_lower = query.lower()

        for level, synonyms in level_keywords.items():
            for synonym in synonyms:
                if synonym in query_lower:
                    found_levels.append({
                        "level": level,
                        "synonym": synonym,
                        "confidence": 0.9
                    })
                    break  # Only add each level once

        return found_levels

    @staticmethod
    def _extract_topics(query: str) -> List[str]:
        """Extract general topics from the query."""
        # Simple topic extraction based on common words
        topics = []
        query_lower = query.lower()

        topic_indicators = {
            "technology": ["tech", "software", "programming", "coding", "computer"],
            "business": ["business", "management", "leadership", "strategy", "marketing"],
            "design": ["design", "ui", "ux", "graphic", "creative"],
            "data": ["data", "analytics", "statistics", "database", "information"]
        }

        for topic, keywords in topic_indicators.items():
            if any(kw in query_lower for kw in keywords):
                topics.append(topic)

        return topics

    @staticmethod
    def _extract_actions(query: str) -> List[str]:
        """Extract action verbs from the query."""
        actions = []
        query_lower = query.lower()

        action_words = [
            "learn", "study", "practice", "improve", "develop", "build", "create",
            "assess", "evaluate", "test", "recommend", "suggest", "find", "search",
            "help", "guide", "teach", "train", "analyze", "review"
        ]

        for action in action_words:
            if action in query_lower:
                actions.append(action)

        return actions

    @staticmethod
    def _evaluate_entity_extraction(entities: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Evaluate the quality of entity extraction."""
        total_entities = sum(len(v) if isinstance(v, list) else 0 for v in entities.values())
        query_words = len(query.split())

        # Calculate extraction density
        density = total_entities / max(query_words, 1)

        # Quality score based on density and coherence
        quality_score = min(density * 2, 1.0)  # Max score of 1.0

        return {
            "total_entities": total_entities,
            "extraction_density": density,
            "quality_score": quality_score
        }

    @staticmethod
    def get_contextual_response(
        intent: str,
        entities: Dict[str, Any],
        user_context: Dict[str, Any],
        conversation_memory: Optional[ConversationMemory] = None
    ) -> Optional[str]:
        """
        Generate contextual response based on intent and entities with memory.
        """
        # Enhanced contextual responses
        if intent == "skills" and entities.get("skills"):
            skills = [s["name"] for s in entities["skills"][:3]]
            return f"I see you're interested in {', '.join(skills)}. How would you rate your proficiency in these skills?"

        if intent == "career" and entities.get("careers"):
            careers = [c["name"] for c in entities["careers"][:2]]
            return f"Tell me more about your interest in {', '.join(careers)} roles. What aspects appeal to you most?"

        if intent == "learning" and user_context.get("recent_skills"):
            recent = user_context["recent_skills"][:2]
            return f"Based on your recent skill assessments in {', '.join(recent)}, I can help create a personalized learning path."

        if intent == "assessment":
            return "I'd be happy to help you assess your skills! Which area would you like to focus on?"

        # Memory-based responses
        if conversation_memory and AISettings.ENABLE_MEMORY:
            history = conversation_memory.memory.get("conversation_history", [])
            if history:
                last_intent = history[-1].get("intent")
                if last_intent == intent:
                    return "I remember we were discussing this topic. Would you like to continue where we left off?"

        return None

    # Legacy method for backward compatibility
    @staticmethod
    def classify_intent_legacy(query: str) -> str:
        """Legacy method for backward compatibility."""
        result = IntentClassifier.classify_intent(query)
        return result["intent"]
