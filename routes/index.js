var config = require("../config");
var ADNAPI = require("../adn-api").ADNAPI;
var sys = require('util');
var User = require('../models/user').User;
var BlogPost = require('../models/BlogPost').BlogPost;
var Showdown = require('../showdown');

function getClientIp(req) {

  var ipAddress;
  // Amazon EC2 / Heroku workaround to get real client IP
  var forwardedIpsStr = req.header('x-forwarded-for');
  if (forwardedIpsStr) {

    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // Ensure getting client IP address still works in
    // development environment
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};

var render = function(res, path, opts) {
  opts = opts || {};
  opts.sitename = opts.sitename || config.sitename;
  opts.title = opts.title || config.title;
  opts.ga_id = opts.ga_id || config.ga_id;

  res.render(path, opts);
};

var get_user = function(req, callback) {
  var adn_userid = req.session.user.userid;
  User.findOne({adn_userid: adn_userid}, function(err, doc) {
                 if (err) {
                   console.log("ERROR get_user: " + err);
                   callback(err, doc);
                   return;
                 }
                 if (doc) {
                   callback(err, doc);
                 } else {
                   callback("no user!", doc);
                 }
               });
};

exports.index = function(req, res) {
  BlogPost.find().sort('tstamp', -1).exec(generic_doc_handler(res, function(docs) {
    render(res, 'index', {title: "Home", blog_posts: docs, user: req.session.user});
  }));
};

exports.about = function(req, res) {
  render(res, "about", {title: "About", user: req.session.user});
};

exports.bounce_shortid = function(req, res) {
  BlogPost.findOne({shortid: req.params.id}, generic_doc_handler(res, function(doc) {
    res.redirect('/' + doc.postIdStr);
  }));
};

exports.view_post = function(req, res) {

  BlogPost.findOne({postIdStr: req.params.id}, function(e, doc) {
      if (e) {
        res.end('fatal error :(');
        return;
      }
      if (!doc) {
        doc = {};
      }
      var adnapi = new ADNAPI(config.adn_application_access_token);
      adnapi.getStatus(req.params.id, function(err, result, obj) {
                         if (err) {
                           console.log('view_post error w/ api: ' + err);
                           res.end('error....');
                           return;
                         }
                         if (obj.data) {
                           obj = obj.data;
                         }

                         if (obj.annotations && obj.annotations.length && obj.annotations[0].type === "net.jazzychad.adnblog.post") {
                           var mdconverter = new Showdown.converter();
                           var anpost = obj.annotations[0].value;
                           doc.body = mdconverter.makeHtml(anpost.body);
                           doc.title = anpost.title;
                           doc.username = obj.user.username;
                           doc.post_id = obj.id;
                           doc.tstamp = new Date(obj.created_at);
                           doc.num_stars = obj.num_stars;
                           doc.num_replies = obj.num_replies;
                           doc.num_reposts = obj.num_reposts;

                           render(res, 'view_post', {user: req.session.user, blog_post: doc, title: doc.title});

                           update_post(req, res, doc);

                         } else {

                           BlogPost.findOne({postIdStr: req.params.id}).remove();

                           //res.end('invalid post id');
                           render(res, 'not_found', {title: "Not Found", user: req.session.user});


                         }
                       });
                    });

};

exports.user_index = function(req, res) {
  User.findOne({username: req.params.username}, generic_doc_handler(res, function(doc) {
      BlogPost.find({ownerIdStr: doc.adn_userid}).sort('tstamp', -1).exec(generic_doc_handler(res, function(docs) {
        render(res, 'user_index', {title: doc.username, blog_posts: docs, user: req.session.user, author: doc});
      }));
  }));
};

exports.ajax_replies = function(req, res) {
  var adnapi = new ADNAPI(config.adn_application_access_token);
  adnapi.getReplies(req.params.id, function(err, result, data) {
    res.end(JSON.stringify(data));
  });
};

exports.ajax_human_view = function(req, res) {
  BlogPost.findOne({postIdStr: req.params.id}, generic_doc_handler(res, function(blog_post) {
    blog_post.views++;
    update_post(req, res, blog_post);
    res.end('ok');
  }));
};

var generic_doc_handler = function(res, callback) {
  return function(err, doc) {
    if (err) {
      res.end('fatal error');
      return;
    }

    if (doc) {
      callback(doc);
    } else {
      res.end('no such item');

    }
  };
};

exports.new_post = function(req, res) {
  render(res, 'new_post', {user: req.session.user, blog_post: null, title: "New Post"});
};

exports.create_post = function(req, res) {
  publish_post(req, res, true, null);
};

var publish_post = function(req, res, is_newpost, blog_post) {
  get_user(req, function(err, user) {
             if (err) {
               res.end('error!');
               return;
             }
             if (user) {
               if (is_newpost) {
                 blog_post = new BlogPost();
               }


               blog_post.title = req.body.title.trim();
               blog_post.ownerIdStr = user.adn_userid;
               blog_post.ownerUsername = user.username;
               blog_post.save(function(e, d) {
                                if (e) {
                                  console.log('error saving 1st time: ' + e);
                                  return;
                                }
                                console.log('new post shortid: ' + d.shortid);

                                var adnapi = new ADNAPI(user.adn_access_token);
                                var annotations = [
                                  {
                                    type: "net.jazzychad.adnblog.post",
                                    value: {
                                      title: blog_post.title,
                                      body: req.body.body.trim(),
                                      tstamp: +new Date()
                                    }
                                  }
                                ];
                                var entities;
                                if (process.env.NODE_ENV === "production") {
                                  entities = {
                                    links: [
                                      {
                                        pos: 0,
                                        len: d.title.length,
                                        url: config.siteurl + "p/" + d.shortid
                                      }
                                    ]
                                  };
                                }
                                var statusText = d.title + " - " + config.siteurl + "p/" + d.shortid + " - #adnblog";
                                adnapi.postStatus(statusText, {annotations: annotations}, function(err2, result, obj) {
                                                    if (err2) {
                                                      console.log('error posting status: ' + err2);
                                                      return;
                                                    }
                                                    console.log("OBJ!!!!!");
                                                    console.log(sys.inspect(obj));
                                                    console.log("<<<< OBJ!!!!!!");
                                                    if (!obj.data || !obj.data.id) {
                                                      res.end('something went terribly wrong :(');
                                                      return;
                                                    }
                                                    d.postIdStr = obj.data.id;
                                                    d.save(function(ee, dd) {
                                                             if (ee) {
                                                               console.log('error saving 2nd time: ' + ee);
                                                               return;
                                                             }
                                                             res.redirect('/' + dd.postIdStr);
                                                           });
                                                  });
                              });


             } else {

               res.end('no user!');
               return;
             }
  });
};

var update_post = function(req, res, blog_post, callback) {
  if (blog_post && blog_post.save) {
    blog_post.save(function(err, doc) {
                     if (callback) {
                       callback();
                     }
                   });
  }
};

exports.login = function(req, res) {
  res.redirect("https://alpha.app.net/oauth/authenticate?client_id=" + config.adn_consumer_key + "&response_type=token&redirect_uri=" + config.adn_callback + "&scope=basic,stream,write_post,follow,messages,export,email");
};

exports.logout = function(req, res) {
  req.session.destroy(function(err) {
                        if (err) {
                          console.log("error logging out: " + err);
                        }
                        res.redirect("/");
                      });
};

exports.oauth_return = function(req, res) {
  render(res, "oauth_return", {title: "One moment..."});
};

exports.auth_token = function(req, res) {
  var access_token = req.body.access_token;

  var adnapi = new ADNAPI(access_token);

  adnapi.getUser(function(err, result, data) {
                   console.log(sys.inspect(data));
                   if (err) {
                     console.log('login error');
                     res.end('error');
                     return;
                   }
                   console.log(sys.inspect(data));
                   data = data.data;
                   req.session.user = {};
                   req.session.user.userid = data.id;
                   req.session.user.access_token = access_token;
                   req.session.user.username = data.username;
                   req.session.user.avatar = data.avatar_image.url;
                   req.session.user.is_admin = data.id == config.admin_userid ? true : false;

                   User.findOne({adn_userid: data.id}, function(err, doc) {
                                  if (err) {
                                    console.log("ERROR: " + err);
                                    res.end('error');
                                    return;
                                  }
                                  if (!doc) {
                                    doc = new User();
                                  }
                                  doc.username = data.username;
                                  doc.adn_userid = data.id;
                                  doc.name = data.name;
                                  doc.adn_access_token = access_token;
                                  doc.avatar = data.avatar_image.url;
                                  doc.is_admin = data.id === config.admin_userid ? true : false;
                                  doc.save(function(e,d){});

                                  res.end('ok');

                                });


                 });




};
