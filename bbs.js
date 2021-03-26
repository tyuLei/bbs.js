const express = require('express')
const cookieParser = require("cookie-parser")
const sqlite = require("sqlite")
const sqlite3 = require("sqlite3")
const multer = require("multer")
const fsp = require("fs").promises
const path = require("path")
const uploader = multer({ dest: __dirname + "/uploads/" })
const nodemailer = require("nodemailer")
const url = require('url')
var svgCaptcha = require("svg-captcha")
var session = require('express-session')

const app = express()
const port = 8084

let db
sqlite.open({
  filename: __dirname + "/bbs2.db",
  driver: sqlite3.Database
}).then(value => {
  db = value
})



app.set('views', __dirname + '/views')

app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})

// app.use((req, res, next) => {
//   req.on("data", data => {
//     console.log(data.toString())
//   })
// })

app.use(express.static(__dirname + '/static'))
app.use(express.json())
//use解析以/uploads开头的文件，匹配__dirname + /uploads + /uploads后面的内容
app.use("/uploads", express.static(__dirname + "/uploads"))
//解析url标签
app.use(express.urlencoded({ extended: true }))
//解析cookie,这个功能是cookieParser提供的,而解析体里的req.cookie是express完成的
app.use(cookieParser("sdfasduouio"))


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))
// var sessionStore = Object.create(null)
// app.use(function sessionMW(req, res, next) {
//   if (req.cookies.sessionId) {
//     //如果sessionId存在则把sessionStore里的值赋给session
//     req.session = sessionStore[req.cookies.sessionId]
//     if (!req.session) {
//       req.session = sessionStore[req.cookies.sessionId] = {}
//     }
//   } else {
//     //如果不存在session则为session和sessionStore赋一个对象
//     let id = Math.random().toString(16).slice(2)
//     req.session = sessionStore[id] = {}
//     res.cookie("sessionId", id, {
//       maxAge: 86400000,
//     })
//   }

//   next()
// })




//如果存在cookie，则使用cookie的user
app.use(async (req, res, next) => {
  if (req.signedCookies.user) {
    let user = await db.get('SELECT rowid as id,  * FROM users WHERE name = ?', req.signedCookies.user)
    req.user = user
    console.log(req.user, req.signedCookies.user)
  }
  next()
})





//获取验证码图片
app.get("/captcha", function (req, res) {
  var captcha = svgCaptcha.create("ignoreChars")
  req.session.captcha = captcha.text
  res.type('svg')
  res.status(200).send(captcha.data)
})

// app.get("/captcha", function (req, res, next) {
//   var captcha = Math.random().toString().slice(2, 6)
//   req.session.captcha = captcha
//   console.log("验证码", sessionStore)
//   res.type("image/svg+xml")
//   res.send(`
//     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" version="1.1">
//     <text  x="0" y="15" fill="red">${captcha}</text>
//     </svg>
//   `)
//   next()
// })

//注册页面
app.route("/register")
  .get((req, res, next) => {
    res.render('register.pug')
  })
  .post(uploader.single("avatar"), async (req, res, next) => {
    let user = req.body
    let file = req.file
    //防止图片重名
    var targetName = file.path + "-" + file.originalname

    await fsp.rename(file.path, targetName)

    var avartarOnlineUrl = "/uploads/" + path.basename(targetName)
    console.log("收到注册请求", user, file)
    try {
      await db.run(
        `INSERT INTO users VALUES (?,?,?,?)`,
        [req.body.name, req.body.password, req.body.email, avartarOnlineUrl]
      )

      res.render("register-result.pug", {
        result: "注册成功",
        code: 0,
      })
    } catch (e) {
      res.render("register-result.pug", {
        result: "注册失败",
        code: -1,
      })
    }

  })


//登出页面
app.get("/logout", (req, res, next) => {
  res.clearCookie("user")
  res.redirect("/")
})




//检测用户名是否重复
//发送过来的name=tang在req.query上
app.get('/username-conflict-check', async (req, res, next) => {
  // let qureyName = users.find(it => it.name == req.query.name)
  var user = await db.get("SELECT * FROM users WHERE name = ? ", req.query.name)
  var email = await db.get("SELECT * FROM users WHERE email = ? ", req.query.email)
  if (user == undefined && email == undefined) {
    res.json({
      code: -1,
      msgUser: "有效名称",
      msgEmail: "有效邮箱"
    })
  } else if (user == undefined && email !== undefined) {
    res.json({
      code: 0,
      msgUser: "有效邮箱",
      msgEmail: "该邮箱已被占用",
    })
  } else if (user !== undefined && email == undefined) {
    res.json({
      code: 0,
      msgUser: "该名称已被占用",
      msgEmail: "有效名称",
    })
  } else if (user !== undefined && email !== undefined) {
    res.json({
      code: 0,
      msgUser: "该名称已被占用",
      msgEmail: "该邮箱已被占用",
    })
  }





})



//登陆页面
//登陆的路径是恰好写成'/login'的，C发送的请求是'/login',S解析后给"/login"生成了一个页面
//cookie接的3个参数分别是,名字，值，和设置参数
app.route("/login")
  .get((req, res, next) => {
    let previousUrl = req.get("referer")
    let previousUrl2 = previousUrl
    try {
      previousUrl2 = url.parse(previousUrl2)
    } catch (error) {
      console.log(error)
      previousUrl = ''
    }
    if (previousUrl2 && previousUrl2.pathname == '/register') {
      previousUrl = '/'
    }
    console.log('parsename', previousUrl2.pathname)
    res.render('login.pug', {
      previousUrl: previousUrl,
    })

  })
  .post(async (req, res, next) => {
    let user = await db.get(`SELECT * from users where name =  ? and password = ? `, [req.body.name, req.body.password])
    if (req.body.captcha !== req.session.captcha) {
      res.json({
        code: 1,
        msg: "验证码错误"
      })
      return
    }



    if (user) {
      res.cookie('user', user.name, {
        maxAge: 84600000,
        signed: true
      })
      res.json({
        code: 0,
        msg: "登陆成功"
      })
    } else {
      res.json({
        code: -1,
        msg: "登陆失败，用户名或密码错误"
      })
    }

  })



const config = {
  service: "QQ",
  auth: {
    user: '642568902@qq.com',
    pass: 'ldkzdvjihhwqbbee'   //授权码生成之后，要等一会才能使用，否则验证的时候会报错，但是不要慌张哦
  }
}




var changePasswordMap = {}
app.route("/forgot")
  .get((req, res, next) => {
    res.render("forgot.pug")
  })
  .post(async (req, res, next) => {
    var email = req.body.email
    var user = await db.get("SELECT * FROM users WHERE email =?", email)
    if (user) {
      var changePasswordId = Math.random().toString(16).slice(2)
      //在changePasswordMap的changePasswordId中存入user
      changePasswordMap[changePasswordId] = user
      setTimeout(() => {
        delete changePasswordMap[changePasswordId]
      }, 1000 * 60 * 10)
      var changePasswordLink = "http://localhost:8082/change-password/" + changePasswordId



      const transporter = nodemailer.createTransport(config)
      const mail = {
        // 发件人 邮箱  '昵称<发件人邮箱>'
        from: `"web"<642568902@qq.com>`,
        // 主题
        subject: '修改密码',
        // 收件人 的邮箱 可以是其他邮箱 不一定是qq邮箱
        to: `${user.email}`,
        //这里可以添加html标签
        html: `<b>您的修改链接为：${changePasswordLink} ,10分钟内有效，请谨慎保管。</b>`
      }

      //  发送邮件 调用transporter.sendMail(mail, callback)
      transporter.sendMail(mail, function (error, info) {
        if (error) {
          return console.log(error);
        }
        transporter.close()
        console.log('mail sent:', info.response)
      })

      res.end('A link has send to you email, open your Inbox and click the link to change password.')
      console.log(changePasswordLink)
    } else {
      res.end("该邮箱未注册")
    }
  })

app.route("/change-password/:id")
  .get(async (req, res, next) => {
    var user = changePasswordMap[req.params.id]
    if (user) {
      res.render("change-password.pug", { user: user })
    } else {
      res.end("link has expired")
    }
  })
  .post(async (req, res, next) => {
    var user = changePasswordMap[req.params.id]
    await db.run('UPDATE users SET password = ? WHERE name = ?', req.body.password, user.name)
    delete changePasswordMap[req.params.id]
    res.end("password change success!")
  })










//当服务器接收到get请求时,根目录返回库里所有的post，并渲染

app.get('/', async (req, res, next) => {
  var posts = await db.all("SELECT posts.rowid as id, * FROM posts JOIN users ON posts.userId=users.rowid")
  //render传的对象可以在index.pug内使用
  res.render("index.pug", {
    user: req.user,
    posts: posts,

  })
})







//帖子路由
app.route('/post')
  .get((req, res, next) => {
    res.render('add-post.pug', {
      user: req.user
    })
  })//发帖
  .post(async (req, res, next) => {
    //req.body是tittle和content两个由urlencode解析出来的对象
    var post = req.body
    console.log(res.user)
    await db.run(
      `INSERT INTO posts VALUES (?,?,?,?,?)`,
      [post.title, post.content, new Date().toISOString(), req.user.id, 0]
    )
    // 当两个同时发帖时，可能由于加载原因查到错误的id
    // 通过rowid倒叙查找第一项

    var post = await db.get("SELECT rowid as id, * FROM posts ORDER BY rowid DESC LIMIT 1")
    //发完帖子跳到帖子上去
    console.log("post.id", post.id)
    res.redirect("/post/" + post.id)

  })


//点击title跳转到内容详情页面
app.get("/post/:id", async (req, res, next) => {
  //params对应这:id匹配到的内容
  //要拿到发帖人信息，帖子评论，连表查询
  var post = await db.get(` select posts.rowid as id,
  title,
  content,
  createAt,
  userId,
  name,
  avatar from posts join user on userId = user.id
  where posts.rowid = ?`,
    req.params.id)

  if (post) {
    //当发送帖子时，找到贴子的ID
    var comments = await db.all(`SELECT comments.rowid as id, * FROM comments JOIN users ON userId = users.rowid WHERE postId = ? ORDER BY createdAt DESC`,
      req.params.id)
    await db.run(`update posts set count = ? where posts.rowid = ?`, [comments.length, req.params.id])
    console.log("这是comments", comments)
    var data = {
      post: post,
      comments: comments,
      user: req.user
    }
    res.render('post.pug', data)
  } else {
    res.status(404)
    res.render('404.pug')
  }
})






//回帖
app.post("/comment", async (req, res, next) => {
  console.log('收到评论请求', req.body)

  var comment = req.body
  if (req.user) {
    await db.run(
      `insert into comments values (?, ?, ?, ?)`,
      [comment.postId/*回复的哪个帖子*/, req.user.id, comment.content, new Date().toISOString()]
    )

    res.redirect('/post/' + comment.postId)
  } else {
    res.end('未登陆')
  }
})


//用户信息
app.get("/user/:id", async (req, res, next) => {
  let param = Number(req.params.id)
  let userInfo = await db.get(`select * from users where rowid = ? `, req.params.id)

  if (userInfo) {

    console.log("param", param)
    var userPosts = await db.all('SELECT rowid as id, * FROM posts WHERE posts.userId = ? ORDER BY createAt DESC', param)
    var userComments = await db.all('SELECT postId, title as postTitle, comments.content, comments.createdAt, postsAvatars.avatar FROM comments JOIN postsAvatars ON postId = postsAvatars.rowid WHERE comments.userId = ? ORDER BY comments.createdAt DESC', param)
    // var [userPosts, userComments] = await Promise.all([userPostsPromise, userCommentsPromise])
    console.log("userPosts", userPosts)
    res.render("user-profile.pug", {
      user: req.user,
      userInfo,
      userPosts,
      userComments,
    })
  } else {
    res.end("查无此人")
  }
})



app.listen(port, () => {
  console.log("success listen", port)
})