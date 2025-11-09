const fs = require('fs-extra');
const axios = require('axios');

(async () => {
  try {
    const manifestPath = 'AppID/manifest.json';
    if (!fs.existsSync(manifestPath)) {
      console.error('manifest.json not found in AppID/');
      process.exit(1);
    }

    const manifest = await fs.readJson(manifestPath);
    const appIds = manifest.appids || [];

    if (appIds.length === 0) {
      console.error('No AppIDs found in manifest.json');
      process.exit(1);
    }

    for (let appId of appIds) {
      try {
        // Fetch game info
        const storeResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const game = storeResponse.data[appId].data;

        // Fetch achievements schema
        const schemaResponse = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${process.env.STEAM_API_KEY}&appid=${appId}`);
        const achievements = (schemaResponse.data.game && schemaResponse.data.game.availableGameStats && schemaResponse.data.game.availableGameStats.achievements) || [];

        const htmlData = achievements.map(a => `
          <div class="achievement">
            <img src="${a.icon || ''}" class="achievement-icon" />
            <div class="achievement-info">
              <div class="achievement-name">${a.displayName}</div>
              <div class="achievement-desc">${a.description || ''}</div>
            </div>
          </div>
        `).join('');

        const gameHtml = `
        <div class="game-card">
          <div class="game-header">
            <img src="${game.header_image}" class="game-icon" />
            <div class="game-info">
              <div class="game-title">${game.name}</div>
              <div class="game-appid">AppID: ${appId}</div>
            </div>
          </div>
          <div class="achievements-list">${htmlData}</div>
        </div>`;

        await fs.ensureDir('output');
        await fs.writeFile(`output/game-${appId}.html`, gameHtml);

        console.log(`Fetched achievements for ${game.name} (AppID: ${appId})`);

      } catch (e) {
        console.error(`Error fetching AppID ${appId}:`, e.message);
      }
    }

    console.log('All games fetched successfully');

  } catch (err) {
    console.error('Error reading manifest.json or fetching data:', err.message);
    process.exit(1);
  }
})();
