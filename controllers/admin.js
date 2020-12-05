const JWT = require('jsonwebtoken');
const Admin = require('../models/admin');

signToken = user => {
    return JWT.sign({
        id: user._id,
        iat: new Date().getTime()
    }, process.env.TOKEN_SECRET);
}

module.exports = {
    signUp: async (req, res) => {
        const { name, email, password } = req.body;
        const existAdmin = await Admin.findOne({ email });
        if(existAdmin) return res.status(403).json({
            error: 'Email has already existed'
        });

        const newAdmin = new Admin({
            name: name,
            email: email,
            password: password,
        });
        await newAdmin.save();

        const token = signToken(newAdmin);
        res.status(200).json({ token });
    },
    signIn: async (req, res) => {
        const token = signToken(req.user);
        res.status(200).json({ token });
    },
    getUser: async (req, res) => {
        res.status(200).json(req.user);
    }
}