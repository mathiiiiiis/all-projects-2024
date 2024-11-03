import aiohttp
import datetime

class DiscordAuth:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.session = None

    async def setup(self):
        self.session = aiohttp.ClientSession()

    async def get_token_response(self, data):
        async with self.session.post("https://discord.com/api/oauth2/token", data=data) as response:
            if response.status == 200:
                token_data = await response.json()
                return token_data['access_token'], token_data['refresh_token'], token_data['expires_in']
            return None

    async def get_user(self, token):
        headers = {
            "Authorization": f"Bearer {token}"
        }
        async with self.session.get("https://discord.com/api/v10/users/@me", headers=headers) as response:
            if response.status == 200:
                return await response.json()
            return None

    async def get_guilds(self, token):
        headers = {
            "Authorization": f"Bearer {token}"
        }
        async with self.session.get("https://discord.com/api/v10/users/@me/guilds", headers=headers) as response:
            if response.status == 200:
                return await response.json()
            return None
