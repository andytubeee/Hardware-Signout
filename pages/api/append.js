const { GoogleSpreadsheet } = require('google-spreadsheet');
import { pageIds } from '../../lookup';
import absoluteUrl from 'next-absolute-url';
import axios from 'axios';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_PRIVATE_KEY;
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

export default async function handler(req, res) {
  const reqData = req.body.data;
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
  await doc.loadInfo();
  const sheet = doc.sheetsById[pageIds.currentRequests];
  const totalSheet = doc.sheetsById[pageIds.total];
  const componentsCombinedArr = [];
  Object.keys(reqData.amounts).forEach((key) => {
    componentsCombinedArr.push({
      Name: reqData.name,
      Email: reqData.email,
      School: reqData.school,
      Component: key,
      Profession: reqData.profession,
      Amount: reqData.amounts[key],
      ['Date Out']: new Date(),
    });
  });

  try {
    await sheet.addRows(componentsCombinedArr);
    const TotalInventoryRows = await totalSheet.getRows();
    // await TotalInventoryRows.forEach((item) => {
    //   if (item['Component'] in reqData.amounts) {
    //     item['Available Stock'] -= reqData.amounts[item['Component']];
    //     item.save();
    //   }
    // });
    const { origin } = absoluteUrl(req);

    // Sending confirmation email
    axios
      .post(`${origin}/api/sendEmail`, {
        name: reqData.name,
        email: reqData.email,
      })
      .then(function () {
        return res.status(200).json({ status: 'Sent' });
      })
      .catch(function (err) {
        console.log(err);
        return res.status(500).json({ status: 'Error' });
      });
  } catch {
    return res.status(500).json({ status: 'Error' });
  }
}
