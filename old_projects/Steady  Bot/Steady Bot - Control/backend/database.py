import uuid
from datetime import datetime, timedelta
import ezcord

class DashboardDB(ezcord.DBHandler):
    def __init__(self):
        super().__init__("dashboard.db")

    async def setup(self):
        await self.exec(
            """CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT UNIQUE,
                token TEXT,
                refresh_token TEXT,
                token_expires_at TIMESTAMP,
                user_id TEXT PRIMARY KEY
            )"""
        )
        await self.exec(
            """CREATE TABLE IF NOT EXISTS command_settings (
                guild_id TEXT,
                command_name TEXT,
                enabled INTEGER DEFAULT 1,
                PRIMARY KEY (guild_id, command_name)
            )"""
        )

    async def add_session(self, token, refresh_token, expires_in, user_id):
        session_id = str(uuid.uuid4())
        expires = datetime.now() + timedelta(seconds=expires_in)
        await self.exec(
            """INSERT OR REPLACE INTO sessions (session_id, token, refresh_token, token_expires_at, user_id)
            VALUES (?, ?, ?, ?, ?)""",
            (session_id, token, refresh_token, expires, user_id)
        )
        return session_id

    async def get_session(self, session_id):
        return await self.one(
            "SELECT token, refresh_token, token_expires_at, user_id FROM sessions WHERE session_id = ?",
            (session_id,)
        )

    async def get_command_settings(self, guild_id, command_name):
        setting = await self.one(
            "SELECT enabled FROM command_settings WHERE guild_id = ? AND command_name = ?",
            (guild_id, command_name)
        )
        return setting["enabled"] if setting else 1

    async def set_command_settings(self, guild_id, command_name, enabled):
        await self.exec(
            """INSERT OR REPLACE INTO command_settings (guild_id, command_name, enabled)
            VALUES (?, ?, ?)""",
            (guild_id, command_name, enabled)
        )

db = DashboardDB()
