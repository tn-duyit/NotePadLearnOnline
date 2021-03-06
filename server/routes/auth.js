const express = require('express')
const router = express.Router()
const argon2 = require('argon2')
const jwt = require('jsonwebtoken')

const User = require('../models/User')
const { route } = require('./post')
const verifyToken = require('../middleware/auth')
//get api/auth
//if user logged
router.get('/', verifyToken, async(req,res)=>{
    try{
        const user = await User.findById(req.userId).select('-password')
        if(!user) return res.status(400).json({success:false, message:'User not found'})
        res.json({success:true,user})
    }catch(error){
        console.log(error)
        res.status(500).json({success: false, message:'Internal server error'})
    }
})

//router.get('/',(req,res)=>res.send('USER ROUTE'))
// POST api/auth/register
//register user
// access public
router.post('/register', async(req,res)=>{
    const{username, password}= req.body

    if(!username || !password)
    return res.status(400).json({success:false, message:'Missing username and/or password'})
    try{
        // check user exist
        const user = await User.findOne({username})
        if(user)
        return res.status(400).json({success:false, message:'Username already taken'})
        const hashedPassword = await argon2.hash(password)
        const newUser = new User({username,password: hashedPassword})
        await newUser.save()
        // return token
        const accessToken = jwt.sign({userId: newUser._id}, process.env.ACCESS_TOKEN_SECRET)
        res.json({success:true, message:'User created successfully',accessToken })
    }catch(error)
    {
        console.log(error)
        res.status(500).json({success: false, message:'Internal server error'})
    }    
})
// POST api/auth/login
//login user
// access public
router.post('/login', async(req,res)=>{
    const{username, password}= req.body
    if(!username || !password)
    return res.status(400).json({success:false, message:'Missing username and/or password'})
    try{
        // check user exist
        const user = await User.findOne({username})
        if(!user)
        return res.status(400).json({success:false, message:'Incorrect username or password'})
        // User found
        const passwordValid = await argon2.verify(user.password, password)
        if(!passwordValid)
        return res.status(400).json({success:false, message:'Incorrect username or password'})
        // return token
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET)
        res.json({success:true, message:'User logged in successfully',accessToken })
    }catch(error){
        console.log(error)
        res.status(500).json({success: false, message:'Internal server error'})
    }
})
module.exports = router