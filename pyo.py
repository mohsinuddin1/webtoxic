# import requests

# API_KEY = "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"  # ⚠️ Use a NEW key (old one is compromised)

# # Simple test - list available models
# response = requests.get(
#     "https://integrate.api.nvidia.com/v1/models",
#     headers={"Authorization": f"Bearer {API_KEY}"}
# )

# print(f"Status: {response.status_code}")
# print(response.text[:500])

import requests


BASE_URL = "https://world.openfoodfacts.org"
USERNAME = "mohsinuddin"
PASSWORD = "PDw65Jrxza24WBR"
API_TOKEN = "uddin"

USER_AGENT = "MyProductAgent/1.0 (https://yourapp.com contact@yourapp.com)"
import requests

url = "https://world.openfoodfacts.org/api/v2/product/737628064502"

response = requests.get(url)
print(response.status_code)
print(response.json())

{
  "imageUrl": "https://www.silkrute.com/images/detailed/3201/61iv_r9ocdL.jpg",
  "imageBase64": null,
  "scanMode": "Ingredient"
}