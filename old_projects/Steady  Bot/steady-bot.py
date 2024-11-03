import discord
from discord.ext import commands, tasks
from discord import app_commands
from datetime import timedelta
from typing import Optional

intents = discord.Intents.default()
intents.members = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)

class ModerationCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    async def get_member(self, interaction: discord.Interaction) -> Optional[discord.Member]:
        guild = interaction.guild
        if guild is None:
            return None
        return guild.get_member(interaction.user.id)

    async def greet(self, interaction: discord.Interaction):
        member = await self.get_member(interaction)
        if member is None:
            await interaction.response.send_message("Could not find the member.", ephemeral=True)
        else:
            await interaction.response.send_message(f"Hello, {member.name}!")

    @app_commands.command(name="ban", description="Bans a member from the server")
    async def ban(self, interaction: discord.Interaction, 
                  target: discord.Member, 
                  reason: str = "No reason provided"):
        member = await self.get_member(interaction)
        if member is None or not member.guild_permissions.ban_members:
            await interaction.response.send_message(
                "You do not have permission to use this command.", 
                ephemeral=True
            )
            return

        try:
            await target.ban(reason=reason)
            ban_embed = discord.Embed(
                color=discord.Color.red(),
                description=f"🔨 {target} has been banned for: {reason}"
            )
            await interaction.response.send_message(embed=ban_embed)
        except Exception as e:
            await interaction.response.send_message(f"Error: {e}", ephemeral=True)

    @app_commands.command(name="kick", description="Kicks a member from the server")
    async def kick(self, interaction: discord.Interaction, 
                   target: discord.Member, 
                   reason: str = "No reason provided"):
        member = await self.get_member(interaction)
        if member is None or not member.guild_permissions.kick_members:
            await interaction.response.send_message(
                "You do not have permission to use this command.", 
                ephemeral=True
            )
            return

        try:
            await target.kick(reason=reason)
            kick_embed = discord.Embed(
                color=discord.Color.orange(),
                description=f"👟 {target} has been kicked for: {reason}"
            )
            await interaction.response.send_message(embed=kick_embed)
        except Exception as e:
            await interaction.response.send_message(f"Error: {e}", ephemeral=True)

    @app_commands.command(name="timeout", description="Puts a member in timeout")
    async def timeout(self, interaction: discord.Interaction, 
                      target: discord.Member, 
                      duration: int, 
                      reason: str = "No reason provided"):
        member = await self.get_member(interaction)
        if member is None or not member.guild_permissions.moderate_members:
            await interaction.response.send_message(
                "You do not have permission to use this command.", 
                ephemeral=True
            )
            return

        try:
            timeout_until = discord.utils.utcnow() + timedelta(minutes=duration)
            await target.timeout(timeout_until, reason=reason)
            timeout_embed = discord.Embed(
                color=discord.Color.blue(),
                description=f"⏲️ {target} has been timed out for {duration} minutes for: {reason}"
            )
            await interaction.response.send_message(embed=timeout_embed)
        except Exception as e:
            await interaction.response.send_message(f"Error: {e}", ephemeral=True)

    @app_commands.command(name="ping", description="Check the bot's latency.")
    async def ping(self, interaction: discord.Interaction):
        try:
            latency = round(bot.latency * 1000) 
            ping_embed = discord.Embed(
                color=discord.Color.green(),
                description=f"🏓 Pong! Latency: {latency}ms"
            )
            await interaction.response.send_message(embed=ping_embed)
        except Exception as e:
            await interaction.response.send_message(f"Error: {e}", ephemeral=True)

    @commands.Cog.listener()
    async def on_ready(self):
        await bot.tree.sync()
        print(f"Logged in as {self.bot.user}.")
        self.update_status.start()

    @tasks.loop(minutes=5)
    async def update_status(self):
        await bot.change_presence(
            status=discord.Status.do_not_disturb,
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name=f"{len(bot.guilds)} servers"
            )
        )

async def main():
    await bot.add_cog(ModerationCommands(bot))
    await bot.start('MTI3ODQyNjI4NjU2MTQyNzQ4Ng.GbKHs8.iy_mFeUeSoRW7FHSljb8TQSVI5YIW_JStwlgiM')  

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
