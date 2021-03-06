
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, auth = require('connect-auth')
, MongoStore = require('connect-mongo')(express)
, config = require('./config')
, mongoose = require('mongoose');

mongoose.connect(config.mongo_uri);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false, pretty: false});
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
                            secret: config.express_session_secret,
                            store: new MongoStore({
                                                  url: config.mongo_uri,
                                                  db: "adn_sessions",
                                                  auto_reconnect: true,
                                                  clear_interval: 600
                                                  }, function() {console.log("connected to mongo!");})
                          }));

  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var protect = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
};

var admin = function(req, res, next) {
  if (req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.redirect('/');
  }
};

// Routes

app.get('/', routes.index);

app.get('/about', routes.about);

app.get('/compose', protect, routes.new_post);
app.post('/compose', protect, routes.create_post);

app.get('/login', routes.login);
app.get('/logout', routes.logout);

app.get('/oauth/return', routes.oauth_return);
app.post('/auth/token', routes.auth_token);

app.get('/ajax/replies/:id', routes.ajax_replies);
app.post('/ajax/human_view/:id', routes.ajax_human_view);

app.get('/p/:id', routes.bounce_shortid);
app.get('/:id', routes.view_post);

app.get('/user/:username', routes.user_index);

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
