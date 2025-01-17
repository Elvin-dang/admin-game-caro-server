const JWT = require('jsonwebtoken');
const User = require('../models/user');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const mailgun = require("mailgun-js");

const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});

signToken = user => {
    return JWT.sign({
        id: user._id,
        iat: new Date().getTime()
    }, process.env.TOKEN_SECRET);
}

signActivationToken = user => {
    return JWT.sign({
        id: user._id,
        iat: new Date().getTime()
    }, process.env.TOKEN_SECRET_1);
}

signResetPasswordToken = user => {
    return JWT.sign({
        id: user._id,
        iat: new Date().getTime()
    }, process.env.TOKEN_SECRET_2, { expiresIn: '1h' });
}

module.exports = {
    signUp: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const existUser = await User.findOne({ email: email, accessType: 'email' });
            if(existUser) return res.status(403).json({
                message: 'Email has already existed'
            });

            const newUser = new User({
                name: name,
                email: email,
                password: password,
                accessType: 'email'
            });
            await newUser.save();

            const token = signActivationToken(newUser);
            const data = {
                from: 'gamecaro@gmail.com',
                to: email,
                subject: 'Kích hoạt tài khoản',
                html: `
                    <h2>Xin chào ${name},</h2>
                    <p></p>
                    <p>Nhấn vào link bên dưới xác nhận tài khoản của bạn:</p>
                    <p>${process.env.CLIENT_DOMAIN}/account/activate/${token}</p>
                `
            };

            mg.messages().send(data, function (error, body) {
                console.log(body);
            });

            res.status(200).json({ message: "Sign up successfully !! Check email for account activation" });

        } catch(err) {
            res.status(404).json({ err });
        }
    },
    signIn: async (req, res) => {
        if(!_.isEmpty(req.authInfo)) {
            return res.status(401).json(req.authInfo);
        }
        const token = signToken(req.user);
        res.status(200).json({ token })
    },
    getUser: async (req, res) => {
        res.status(200).json(req.user);
    },
    forgetPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const existUser = await User.findOne({ email: email, accessType: 'email' });
            if(!existUser) return res.status(403).json({
                message: 'Email not found'
            });

            const token = signResetPasswordToken(existUser);
            const data = {
                from: 'gamecaro@gmail.com',
                to: email,
                subject: 'Reset mật khẩu',
                html: `
                    <h2>Xin chào ${existUser.name},</h2>
                    <p></p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn.</p>
                    <p>Nhập mã đặt lại mật khẩu sau đây:</p>
                    <p><b>${token}</b></p>
                `
            };

            mg.messages().send(data, function (error, body) {
                console.log(body);
                if(error) return res.status(403).json({
                    message: 'Can not send email'
                });
            });

            res.status(200).json({ result: true });
        } catch(err) {
            res.status(404).json({ result: false });
        }
    },
    confirmToken: async (req, res) => {
        if(!_.isEmpty(req.authInfo)) {
            return res.status(401).json({ result: false });
        }
        res.status(200).json({ result: true });
    },
    resetPassword: async (req, res) => {
        try {
            const sail = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(req.body.password, sail);

            const user = await User.findByIdAndUpdate(req.user._id, {
                password: passwordHash
            }, { new: true });

            res.status(200).json({ result: true });
        } catch(err) {
            res.status(404).json({ result: false });
            console.log(err);
        }
    },
    profile: async (req, res) => {
        console.log(req.body);
        let data;

        if(req.body.password) {
            const sail = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(req.body.password, sail);
            data = {
                email: req.body.email,
                password: passwordHash
            }
        } else {
            data = req.body;
        }

        try{
            const existUser = await User.findOneAndUpdate(
               { "email" : req.body.email, accessType: 'email' }, data);
            res.status(200).json({ msg:"Update successfully!" });
        }
        catch(e){
            res.status(400).json({ msg:"Failed in update user: " + e });
        }
    },
    getAnotherUserByEmail: async (req, res) => {
        try{
            const existUser = await User.findOne({ "email": req.body.email });
            res.status(200).json(existUser);
        }
        catch(e){
            res.status(400).json({ msg:"Failed in get user: " + e });
        }
    },
    getUserById: async (req, res) => {
        try{
            const existUser = await User.findById(req.params.id);
            res.status(200).json(existUser);
        }
        catch(e){
            res.status(400).json({ msg:"Failed in get user: " + e });
        }
    },
    getTopPlayers: async (req, res) => {
        try{
            const existUser = await User.find({}, ['_id','name','avatar'], // Columns to Return
            {
                skip:0, // Starting Row
                limit:10, // Ending Row
                sort:{
                    elo: -1 //Sort by elo
                }
            });
            res.status(200).json(existUser);
        }
        catch(e){
            res.status(400).json({ msg:"Failed in get user: " + e });
        }
    },
    activeAccount: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                active: '2'
            }, { new: true });

            res.status(200).json({ result: true });
        } catch(err) {
            res.status(404).json({ result: false });
            console.log(err);
        }
    },
    blockAccount: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                active: '3'
            }, { new: true });

            res.status(200).json({ result: true });
        } catch(err) {
            res.status(404).json({ result: false });
            console.log(err);
        }
    },
    activeUndefineAccount: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                active: '1'
            }, { new: true });

            res.status(200).json({ result: true });
        } catch(err) {
            res.status(404).json({ result: false });
            console.log(err);
        }
    },
    blockUndefineAccount: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                active: '4'
            }, { new: true });

            res.status(200).json({ result: true });
        } catch(err) {
            res.status(404).json({ result: false });
            console.log(err);
        }
    },
    getAll: async (req, res) => {
        try{
            const existUser = await User.find();
            res.status(200).json(existUser);
        }
        catch(e){
            res.status(400).json({ msg:"Failed in get user: " + e });
        }
    }
}