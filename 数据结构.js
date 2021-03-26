

//数据
// var nextUser = 3
// var users = [
//   {
//     id: 1,
//     name: 'tyulei',
//     password: '666666',
//     email: 'tyulei@qq.com',
//     avatar: '/upload/avatars/12312312.png',
//   },
//   {
//     id: 2,
//     name: 'zhangsan',
//     password: '666666',
//     email: 'zhangsan@qq.com',
//     avatar: '/upload/avatars/12312312.png',
//   }
// ]

// var nextPostId = 3
// //id和ownerId不同，每个贴子有一个特有的id,ownerId对应着user的ID
// var posts = [
//   {
//     title: 'A',
//     content: 'cooooooooooooooool',
//     createdAt: Date.now(),
//     ownerId: 1,
//     commentCount: 2,
//     id: 1,
//   },
//   {
//     title: 'B',
//     content: 'fuuuuuuuuuuuuuuuuul',
//     createdAt: Date.now(),
//     ownerId: 2,
//     commentCount: 0,
//     id: 2,
//   }
// ]

// //回贴有自己的id,和回复谁的帖子的id，以及帖子所有者的id
// var nextCommentId = 3
// let comments = [
//   {
//     id: 1,
//     replyTo: 1,
//     ownerId: 2,
//     content: 'test reply',
//     createdAt: Date.now(),
//   },
//   {
//     id: 2,
//     replyTo: 1,
//     ownerId: 1,
//     content: 'test reply 2222',
//     createdAt: Date.now(),
//   }
// ]





    // if (users.find(it => it.name == user.name)) {
    //   res.render('register-result.pug', {
    //     result: '该名字已被占用，重重新命名',
    //     code: -1,
    //   })
    //   return
    // }

    // if (users.find(it => it.email == user.email)) {
    //   res.render('register-result.pug', {
    //     result: '该邮箱已被占用',
    //     code: -1,
    //   })
    //   return
    // }


    // user.id = nextUser++