# # import requests

# # API_KEY = ""  # ⚠️ Use a NEW key (old one is compromised)

# # # Simple test - list available models
# # response = requests.get(
# #     "https://integrate.api.nvidia.com/v1/models",
# #     headers={"Authorization": f"Bearer {API_KEY}"}
# # )

# # print(f"Status: {response.status_code}")
# # print(response.text[:500])

# import requests


# BASE_URL = "https://world.openfoodfacts.org"
# USERNAME = "mohsinuddin"
# PASSWORD = "PDw65Jrxza24WBR"
# API_TOKEN = "uddin"

# USER_AGENT = "MyProductAgent/1.0 (https://yourapp.com contact@yourapp.com)"
# import requests

# url = "https://world.openfoodfacts.org/api/v2/product/737628064502"

# response = requests.get(url)
# print(response.status_code)
# print(response.json())

# {
#   "imageUrl": "https://www.silkrute.com/images/detailed/3201/61iv_r9ocdL.jpg",
#   "imageBase64": null,
#   "scanMode": "Ingredient"
# }
import requests
import json

# 🔐 Replace with your real API key
GEMINI_API_KEY = ""

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

payload = {
    "contents": [
        {
            "parts": [
                {"text": "Say hello in JSON format like {\"message\": \"hello\"}"}
            ]
        }
    ],
    "generationConfig": {
        "temperature": 0.1,
        "maxOutputTokens": 200
    }
}

try:
    response = requests.post(url, json=payload)
    print("Status Code:", response.status_code)
    print("Raw Response:", response.text)

    if response.status_code == 200:
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        print("\nGemini Output:")
        print(text)
    else:
        print("\nAPI Error:", response.text)

except Exception as e:
    print("Error:", str(e))
