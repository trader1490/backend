import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import User from '../backend/models/userModel.js';
dotenv.config();
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';



import otpGenerator from 'otp-generator'
import nodemailer from 'nodemailer'
const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors('*'))

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);



//=================OTP===========================================//
app.post('/resetpassword',(req,res)=>{res.send("rest password")})



const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, expires: '5m', default: Date.now }
});


app.post('/generate-otp', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({email});

  if(!user){
    return res.json({Status: "false"})
  }

  const OTP = mongoose.model('OTP', otpSchema);

  const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });

  try {
      await OTP.create({ email, otp });

      // Send OTP via email (replace with your email sending logic)
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: "mernm443@gmail.com",
      pass: "kghx vywh xffu dihc",
          }
      });

      await transporter.sendMail({
          from: 'mernm443@gmail.com',
          to: email,
          subject: 'OTP Verification',
          text: `Your OTP for verification is: ${otp}`
      });

      res.json({Status:"Success"});
  } catch (error) {
      console.error(error);
      res.status(500).send('Error sending OTP');
      res.json({Status:"Failed"});
  }
});



//===================Verify OTP==================================//

app.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;

  try {
    const OTP = mongoose.model('OTP', otpSchema);
    const otpRecord = await OTP.findOne({ otp }).exec();

      if (otpRecord) {
        res.json({Status:"Success"});
      } else {
        res.json({Status:"Failed", message:"Enterd OTP is Not matching Dude..Please Check ur MailBox"});
      }
  } catch (error) {
      console.error(error);
      res.status(500).send('Error verifying OTP');
      
  }
});

//=================OTP===========================================//


//=========== Update Password==============//
app.post('/updatepassword', async (req, res) => {

  const { email,password } = req.body;
  if(!password){
    return (res.json({Status:"enterPassword"}))
  }
  const user = await User.findOne({email});

  

  if(user){

     user.password = password;

  }

  await user.save();

  res.json({Status:"Success",data:user})
})
  
//=========== Update Password==============//

app.get('/api/config/paypal', (req, res) =>
  res.send({ clientId: process.env.PAYPAL_CLIENT_ID })
);

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use('/uploads', express.static('/var/data/uploads'));
  app.use(express.static(path.join(__dirname, '/frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  const __dirname = path.resolve();
  app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(port, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
);


