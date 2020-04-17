var express = require('express')
var db = require('../models')
var router = express.Router()

// POST /articles - create a new post
router.post('/', function (req, res) {
  db.article.create({
    title: req.body.title,
    content: req.body.content,
    authorId: req.body.authorId
  })
    .then(function (post) {
      res.redirect('/')
    })
    .catch(function (error) {
      res.status(400).render('main/404')
    })
})

// POST /articles/:id/comments - adds comments to articles
router.post('/:id/comments', function (req, res) {
  db.comment.create(req.body)
    .then(function (comment) {
      res.redirect(`/articles/${req.body.articleId}`)
    })
    .catch(function (error) {
      console.log("FIRE", error)
      res.status(400).render('main/404')
    })
})

// GET /articles/new - display form for creating new articles
router.get('/new', function (req, res) {
  db.author.findAll()
    .then(function (authors) {
      res.render('articles/new', { authors: authors })
    })
    .catch(function (error) {
      res.status(400).render('main/404')
    })
})

// GET /articles/:id - display a specific post and its author
router.get('/:id', function (req, res) {
  db.article.findOne({
    where: { id: req.params.id },
    include: [db.author, db.comment]
  })
    .then(function (article) {
      if (!article) throw Error()
      res.render('articles/show', { article: article })
    })
    .catch(function (error) {
      console.log(error)
      res.status(400).render('main/404')
    })
})

//GET /articles/edit/:id - edit a specific article
router.get('/:id/edit', function (req, res) {
  var authorPromise = db.author.findAll()
  var articlePromise = db.article.findOne({
    where: { id: req.params.id },
    include: [db.author]
  })

  Promise.all([authorPromise, articlePromise])
  .then(function(results) {
    res.render('articles/edit', {id: req.params.id, authors: results[0], article: results[1] } )
  })
  .catch(function (error) {
    console.log(error)
    res.status(400).render('main/404')
  })
})

//PUT /articles/:id - edit the article in db
router.put('/:id', function (req, res) {
  db.article.update(req.body,
    {
      where: {
        id: req.params.id
      }
    }).then(function () {
      res.redirect(`/articles/${req.params.id}`)
    })
    .catch(function (error) {
      console.log(error)
      res.status(400).render('main/404')
    })
})
module.exports = router
