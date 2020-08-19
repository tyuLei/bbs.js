const express = require('express')
const app = express()
const cookieParser = require("cookie-parser")
const port = 8081


//数据
var nextUser = 3
var users = [
  {
    id: 1,
    name: 'tyulei',
    password: '666666',
    email: 'tyulei@qq.com',
    avatar: '/upload/avatars/12312312.png',
  },
  {
    id: 2,
    name: 'zhangsan',
    password: '666666',
    email: 'zhangsan@qq.com',
    avatar: '/upload/avatars/12312312.png',
  }
]

var nextPostId = 3
//id和ownerId不同，每个贴子有一个特有的id,ownerId对应着user的ID
var posts = [
  {
    title: 'A',
    content: 'cooooooooooooooool',
    createdAt: Date.now(),
    ownerId: 1,
    commentCount: 2,
    id: 1,
  },
  {
    title: 'B',
    content: 'fuuuuuuuuuuuuuuuuul',
    createdAt: Date.now(),
    ownerId: 2,
    commentCount: 0,
    id: 2,
  }
]

let comments = [
  {
    id: 1,
    replyTo: 1,
    ownerId: 2,
    content: 'test reply',
    createdAt: Date.now(),
  },
  {
    id: 2,
    replyTo: 1,
    ownerId: 1,
    content: 'test reply 2222',
    createdAt: Date.now(),
  }
]




app.set('views', __dirname + '/views')

app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})

//next()
app.use(express.static(__dirname + '/static'))
app.use(express.json())
//解析url标签
app.use(express.urlencoded({ extended: true }))
//解析cookie,这个功能是cookieParser提供的,而解析体里的req.cookie是express完成的
app.use(cookieParser("sdfasduouio"))


//如果存在cookie，则使用cookie的user
app.use((req, res, next) => {
  if (req.signedCookies.user) {
    req.user = req.signedCookies.user
  }
  next()
})




//当服务器接收到get请求时,根目录返回库里所有的post，并渲染

app.get('/', (req, res, next) => {
  var postsInfo = posts.map(post => {
    return {
      ...post,
      user: users.find(user => post.ownerId == user.id)
    }
  })
  //render传的对象可以在index.pug内使用
  res.render("index.pug", {
    user: req.user,
    posts: postsInfo,

  })
})



//点击title跳转到内容详情页面
app.get("/post/:id", (req, res, next) => {
  //params对应这:id匹配到的内容
  var post = posts.find(it => it.id == req.params.id)
  console.log(req.params)
  if (post) {
    res.render('post.pug', {
      post: post,
      comments: comments.filter(comment => comment.replyTo == post.id).map(it => {
        return {
          ...it,
          user: users.find(it => users.id == it.ownerId)
        }
      })
    })
  } else {
    res.status(404)
    res.render('404.pug')
  }
})

app.route('/post')
  .get((req, res, next) => {
    res.render('add-post.pug')
  })
  .post((req, res, next) => {
    //req.body是tittle和content两个由urlencode解析出来的对象
    var post = req.body

    post.createdAt = Date.now()
    post.ownerId = 1
    post.id = nextPostId++
    post.commentCount = 0

    posts.push(post)
    //发完帖子跳到帖子上去
    res.redirect('/post/' + post.id)

  })





//注册页面
app.route("/register")
  .get((req, res, next) => {
    res.render('register.pug')
  })
  .post((req, res, next) => {
    let user = req.body
    if (users.find(it => it.name == user.name)) {
      res.render('register-result.pug', {
        result: '该名字已被占用，重重新命名',
        code: -1,
      })
      return
    }

    if (users.find(it => it.email == user.email)) {
      res.render('register-result.pug', {
        result: '该邮箱已被占用',
        code: -1,
      })
      return
    }


    user.id = nextUser++
    user.avatar = '/upload/avatars/3432.png'
    users.push(user)
    res.render('register-result.pug', {
      result: '您已注册成功',
      code: 0,
    })
  })





//检测用户名是否重复
//发送过来的name=tang在req.query上
app.get('/username-conflict-check', (req, res, next) => {
  let qureyName = users.find(it => it.name == req.query.name)
  if (qureyName) {
    res.json({
      code: -1,
      msg: "该名称已被占用",
    })
  } else {
    res.json({
      code: 0,
      msg: "✅",
    })
  }
})



//登陆页面
//登陆的路径是恰好写成'/login'的，C发送的请求是'/login',S解析后给"/login"生成了一个页面
//cookie接的3个参数分别是,名字，值，和设置参数
app.route("/login")
  .get((req, res, next) => {
    res.render('login.pug')
  })
  .post((req, res, next) => {
    let user = users.find(it => it.name == req.body.name && it.password == req.body.password)

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




app.listen(port, () => {
  console.log("success listen", port)
})