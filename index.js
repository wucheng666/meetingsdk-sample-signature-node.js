require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const KJUR = require('jsrsasign')
const request = require("request");
const axios = require("axios");

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json(), cors())
app.options('*', cors())

app.post('/', (req, res) => {

  const iat = Math.round((new Date().getTime() - 30000) / 1000)
  const exp = iat + 60 * 60 * 2

  const oHeader = { alg: 'HS256', typ: 'JWT' }

  const oPayload = {
    sdkKey: process.env.ZOOM_SDK_KEY,
    mn: req.body.meetingNumber,
    role: req.body.role,
    iat: iat,
    exp: exp,
    appKey: process.env.ZOOM_SDK_KEY,
    tokenExp: iat + 60 * 60 * 2
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_SECRET)

  res.json({
    signature: signature,
    body: req.body,
    oPayload: oPayload
  })
})

app.post('/demo', (req, res) => {

 
  res.json({
    demo: "demo success",
    body: req.body
  })
})

app.post("/getAccessToken", (req, res) => {
    // Request an access token using the auth code
    let url = `https://zoom.us/oauth/token?grant_type=authorization_code&code=${req.body.code}&redirect_uri=${encodeURIComponent(process.env.redirectURL)}`;
  

    request
      .post(url, (error, response, body) => {
        console.log("error", error);
        console.log("body", body);

        // Parse response to JSON
        body = JSON.parse(body);

        // Logs your access and refresh tokens in the browser
        console.log(`access_token: ${body.access_token}`);
        console.log(`refresh_token: ${body.refresh_token}`);

        res.json({
          response: body,
        });
        if (body.access_token) {
          // Step 4:
          // We can now use the access token to authenticate API calls
          // Send a request to get your user information using the /me context
          // The `/me` context restricts an API call to the user the token belongs to
          // This helps make calls to user-specific endpoints instead of storing the userID
        } else {
          // Handle errors, something's gone wrong!
        }
      })
      .auth(process.env.ZOOM_SDK_KEY, process.env.ZOOM_SDK_SECRET);
});


app.get("/getAccessToken2", (req, res) => {
  // Request an access token using the auth code

    const baseUrl = "https://zoom.us/oauth/token"
    const url = baseUrl +`?grant_type=authorization_code&code=${req.query.code}&redirect_uri=${process.env.redirectURL}`

    const headers = {
      Authorization:
        'Basic QlV2N3huX0RUblN2Q1p6M2FnYUhuQTpzVjF3QkY5UWpabTIwUFVBc0h5eGJMa2JlazVRN0RUaw==',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    console.log("url11:", url)
    // console.log("url2:", options)
 
      const params = {grant_type: 'authorization_code', code: req.query.code, redirect_uri: encodeURIComponent(process.env.redirectURL) }
      const data = Object.keys(params).map((key) => `${key}=${params[key]}`).join('&');
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic Sk9HX3IwOERTdHFxdE5OUWhMcExnOjc3aFpNNGVJUnNodXdrYXhxckZWVWlVaWt1Yk02bUdN` },
        data,
        url: baseUrl,
      };

      axios(options).then(function (response) {
        console.log("axios...res:", response)
        const tokenData = response.data
        res.status(200).json(tokenData)
        // verifyUserInfo(tokenData.access_token).then(response=>{
        //   let {name, accounts} = response.data
        //   let data = {
        //     ...tokenData,
        //     name,
        //     ...accounts[0]
        //   }
        //   let databaseRef = admin.database().ref('/')
        //   let childRef = databaseRef.push()
        //   childRef.set(data).then(()=>{
        //     res.status(200).json({
        //       auth_id: childRef.key
        //       /*...tokenData,
        //       name,
        //       ...accounts[0]*/
        //     })
        //   })
        // })
      }).catch(function (error) {
        console.log("2error:",error)
        res.status(400).json({message: error});
      });
  
})



app.get("/getAccessToken3", (req, res) => {
  
  const clientId = process.env.ZOOM_SDK_KEY;
  const clientSecret = process.env.ZOOM_SDK_SECRET;
  const decodedString = `${clientId}:${clientSecret}`;
  // const authString = btoa(decodedString);
  const authString = Buffer.from(decodedString).toString('base64');
  // console.log({ authString });
  const url = `https://zoom.us/oauth/token?grant_type=authorization_code&code=${req.query.code}&redirect_uri=${process.env.redirectURL}`;
  const reqConfig = {
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  // to zoom server to get token and refresh token
  const zoomRes = axios.post(url, {}, reqConfig).then(function (response) {
        console.log("axios...res:", response)
        const tokenData = response.data
        res.status(200).json(tokenData);
  })
  
})

app.listen(port, () => console.log(`Zoom Meeting SDK Sample Signature Node.js on port ${port}!`))
