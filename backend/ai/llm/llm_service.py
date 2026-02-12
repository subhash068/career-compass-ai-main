import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

class LLMService:
    @staticmethod
    def generate(system_prompt: str, user_prompt: str) -> str:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content
