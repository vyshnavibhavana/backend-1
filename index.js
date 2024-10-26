const express =require("express")
const app = express()
// Load environment variables from .env file
require('dotenv').config();
const port = process.env.PORT || 8000
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const UserModel = require("./models/user")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const secret_key = process.env.JWT_SECRET
const cookieParser = require("cookie-parser")
app.use(bodyParser.json())
const Task = require('./models/taskcreationmodel');

app.use(cookieParser())
app.use(cors({
    origin:["http://localhost:3000"],
    credentials:true
}))
mongoose.connect("mongodb://localhost:27017/myDatabase").then(()=>{
    console.log("connected to database")
// // })
// mongoose.connect("mongodb+srv://admin:admin@cluster0.rzjxm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(()=>{
//     console.log("connected to database")
})





app.post('/auth/register',async(req,res)=>{
    const {username,email,password} = req.body;
    const user = await UserModel.findOne({email})
    if(user){
        return res.status(400).json({message:"Email already exists"})
    }
    const hashedPass = await bcrypt.hash(password,10)
    const newUser = new UserModel({
        username,
        email,
        password:hashedPass
    })
    await newUser.save()
    return res.json({status:true,message:"User Created"})
});


app.post('/auth/login', async (req,res)=>{
    const {email,password} = req.body;
    const user = await UserModel.findOne({email})
    console.log(user,"user")
    if(!user){
        return res.status(400).json({message:"User not found"})
    }
    const validPassword = await bcrypt.compare(password,user.password)
    if(!validPassword){
        return res.json({message:"password is Incorrect"})
    }
    const token = jwt.sign({email:user.email},secret_key,{expiresIn:"4h"});
    res.cookie("token",token)
    return res.json({status:true,message:"Login Successfull",user,token})
});

const verifyUser =async (req,res,next)=>{
    try {
        const token = req.cookies.token;
        if(!token){
            return res.json({status:false,message:"Auth Failed"})
        }
        const decoded = await jwt.verify(token,secret_key)
        req.user = decoded;
        next()
    } catch (error) {
        console.log(error)
    }
}



app.post('/api/createTask',async (req, res) => {
    try {
      const { title, priority, assignee_id, due_date, status, checklist } = req.body;
  
      const newTask = new Task({
        title,
        priority,
        assignee_id,
        due_date,
        status,
        checklist,
      });
  
      const savedTask = await newTask.save();
  
      res.json({
        status: 'success',
        task: {
          id: savedTask._id,
          title: savedTask.title,
          priority: savedTask.priority,
          assignee: savedTask.assignee_id,
          due_date: savedTask.due_date,
          checklist: savedTask.checklist,
        },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.get('/api/getAllTaskData',async (req, res) => {
    try {
        const tasks = await Task.find({}); 
    
        const columnMapping = {
          'to-do': 'To-do',
          'in-progress': 'In Progress',
          'completed': 'Done'
        };
    
        const columns = {
          Backlog: [],
          'To-do': [],
          'In Progress': [],
          Done: []
        };
    
        tasks.forEach(task => {
          const taskData = {
            id: task.assignee_id, 
            name: task.title, 
            priority: task.priority,
            due_date: task.due_date ? task.due_date.toISOString().split('T')[0] : null, 
            checklist_count: task.checklist.length,
            completed_checklist_count: task.checklist.filter(item => item.completed).length,
            assignees: task.assignee_id ? [task.assignee_id] : [] 
          };
    
          const columnName = columnMapping[task.status] || 'Backlog';
          columns[columnName].push(taskData);
        });
    
        const response = {
          status: 'success',
          board: {
            id: 'board_001', 
            name: 'Project Board',
            columns: Object.keys(columns).map(columnName => ({
              name: columnName,
              tasks: columns[columnName]
            }))
          }
        };
    
        res.json(response);
        res.status(200).json({ response});
      } catch (err) {
        if (!res.headersSent) {
            return res.status(500).json({ status: 'error', message: err.message });
          }
      }

});


app.listen(port,()=>{
    console.log("server is running on port",port)
})


