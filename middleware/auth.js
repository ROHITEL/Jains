// middleware/auth.js

function apiKeyAuth(req, res, next) {


  const providedKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY;



  if (!providedKey) {

    return res.status(401).json({
      error: "Missing API key"
    });
  }

  if (providedKey !== validKey) {
    

    return res.status(403).json({
      error: "Invalid API key"
    });
  }


  req.apiKey = providedKey;
  next();
}

module.exports = apiKeyAuth;
