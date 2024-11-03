import aiohttp

class DiscordAuth:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

    async def get_token_response(self, data):
        async with aiohttp.ClientSession() as session:
            async with session.post("https://discord.com/api/oauth2/token", data=data) as response:
                return await response.json()

    async def exchange_code(self, code):
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
        }
        return await self.get_token_response(data)

    async def refresh_token(self, refresh_token):
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
        return await self.get_token_response(data)


class DiscordAPI:
    def __init__(self, auth):
        self.auth = auth

    async def get_user(self, token):
        headers = {"Authorization": f"Bearer {token}"}
        async with aiohttp.ClientSession() as session:
            async with session.get("https://discord.com/api/users/@me", headers=headers) as response:
                return await response.json()

    async def get_guilds(self, token):
        headers = {"Authorization": f"Bearer {token}"}
        async with aiohttp.ClientSession() as session:
            async with session.get("https://discord.com/api/users/@me/guilds", headers=headers) as response:
                return await response.json()

    async def get_bot_guilds(self, token):
        headers = {"Authorization": f"Bot {token}"}
        async with aiohttp.ClientSession() as session:
            async with session.get("https://discord.com/api/users/@me/guilds", headers=headers) as response:
                return await response.json()
