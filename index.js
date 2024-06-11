const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const request = require("request");
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const apiUrl = process.env.API;
const authorizationToken = process.env.BEARER_TOKEN;

app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());

const addedCustomers = []; // Biến lưu trữ dữ liệu khách hàng đã thêm

app.post("/api/post-data", async (req, res) => {
  try {
    const data = req.body;
    const response = await axios.request({
      method: "post",
      maxBodyLength: Infinity,
      url: apiUrl + "/tcrm/order/create",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authorizationToken}`,
        Cookie:
          "_csrf=cb0106aef52f418066c271f786ff8ad80d75a52edcaa0754c906bd244573a0e4a%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22rzubHQK12uBDns9ayJc0wfdC8YF16hZ8%22%3B%7D",
      },
      data: JSON.stringify(data),
    });

    console.log("Response data:", response.data);

    if (response.data.result === false) {
      res.status(400).json({ error: "Request failed", details: response.data });
    } else {
      res.json(response.data);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const response = await axios.request({
      method: "get",
      maxBodyLength: Infinity,
      url: apiUrl + "/apiv2/order/get-categories",
      headers: {
        Authorization: `Bearer ${authorizationToken}`,
        Cookie:
          "_csrf=cb0106aef52f418066c271f786ff8ad80d75a52edcaa0754c906bd244573a0e4a%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22rzubHQK12uBDns9ayJc0wfdC8YF16hZ8%22%3B%7D",
      },
    });

    console.log("Categories response data:", response.data);

    if (response.data.success && Array.isArray(response.data.data)) {
      res.json(response.data.data);
    } else {
      res.status(400).json({
        error: "Unexpected response data format",
        details: response.data,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Create User
app.post("/create-customer", async (req, res) => {
  const customerData = req.body;

  try {
    const response = await axios.post(
      "https://support-duc.tcrm.vn/apiv2/customer/create",
      customerData,
      {
        headers: {
          Authorization: "Bearer IHYPASEIcg_1gTmMjSfSAxdX6Vkgzpqg",
          "Content-Type": "application/json",
        },
      }
    );

    // Lưu dữ liệu khách hàng vào biến
    addedCustomers.push(response.data);

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating customer", error: error.message });
  }
});

// Endpoint mới để trả về danh sách khách hàng đã thêm
app.get("/added-customers", (req, res) => {
  res.json(addedCustomers);
});

// Get PhoneNumber
// Endpoint to get phone number

let storedPhoneNumber = ""; // Biến để lưu trữ số điện thoại

// Endpoint để lấy số điện thoại từ Zalo API và lưu vào biến storedPhoneNumber
app.post("/get-phone-number", async (req, res) => {
  const { accessToken, phoneNumberToken } = req.body;

  const endpoint = "https://graph.zalo.me/v2.0/me/info";
  const secretKey = "Lq18zbfN9bHFMHFCNONi";
  const options = {
    url: endpoint,
    headers: {
      access_token: accessToken,
      code: phoneNumberToken,
      secret_key: secretKey,
    },
  };

  try {
    const response = await axios(options);
    console.log("Response Code:", response.status);
    console.log("Response Body:", response.data);

    // Kiểm tra xem có số điện thoại trong phản hồi không
    if (response.data && response.data.data && response.data.data.number) {
      // Lưu số điện thoại vào biến storedPhoneNumber
      storedPhoneNumber = response.data.data.number;
      // Gửi số điện thoại về frontend
      res.json({ phoneNumber: storedPhoneNumber });
    } else {
      console.error("Số điện thoại không được trả về từ Zalo API");
      res
        .status(500)
        .json({ error: "Số điện thoại không được trả về từ Zalo API" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint để trả về số điện thoại đã lưu
app.get("/stored-phone-number", (req, res) => {
  res.json({ phoneNumber: storedPhoneNumber });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
