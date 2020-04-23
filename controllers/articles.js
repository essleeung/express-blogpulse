var async = require('async')
var express = require('express')
var db = require('../models')
var router = express.Router()

// POST /articles - create a new post
router.post('/', function (req, res) {
  let tags = []
  if (req.body.tags) {
    tags = req.body.tags.split(',')
  }
  console.log(tags)
  db.article.create({
    title: req.body.title,
    content: req.body.content,
    authorId: req.body.authorId
  })
    .then(function (article) {
      if(tags.length) {
        //TO DO: create tags and associations
        //async.forEach(array, normal forEach function, function to run at the end)
        async.forEach(tags,(t, done) => {
          //this function gets called for every item in the tags array
          //trim gets rid of white space
          db.tag.findOrCreate({
            where: {name: t.trim()}
          })
          .then(([tag, wasCreated]) => {
            //tag was found or created successfully, now we need to add to the join table
            //<model1>.add<model2>(model2 instance)
            article.addTag(tag)
            .then(() => {
              //all done adding tag and relation in join table, call done to indicate
              //that we are done with this iteration of the forEach
              done()
            })
          })
          
        }, () => {
          //this runs when everything has resolved, now we safely move on to the next page
          res.redirect('/articles/' + article.id)
        })
      } else {
        res.redirect('/articles/' + article.id)
      }
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
    include: [db.author, db.comment, db.tag]
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
