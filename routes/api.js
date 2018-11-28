/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var shortid = require('shortid');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

var db = require('../db.js');

const validFields = [
  "issue_title",
  "issue_text",
  "created_by",
  "assigned_to",
  "status_text",
  "open"
];

module.exports = function (app) {
    
  app.route('/api/issues/:project')

    .get(function (req, res){
      var project = req.params.project;
      var search = {};
      var searchFields = Object.keys(req.query).filter(field => req.query[field] !== "" && validFields.includes(field));
      searchFields.forEach(f => {
        search[f] = req.query[f] == "true" ? true : req.query[f];
      });
      search.project = project;
      db.connect(CONNECTION_STRING, function() {
        db.get().collection('issues').find(search).toArray((err, issues) => {
          return res.json(issues);
        });
      });
    })

    .post(function (req, res){
      var project = req.params.project;
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by)
        return res.send("Please provide all required fields");
      db.connect(CONNECTION_STRING, function() {
        var now = new Date();
        var issue = {
          _id: shortid.generate(),
          project: project,
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || "",
          status_text: req.body.status_text || "",
          created_on: now.toISOString(),
          updated_on: now.toISOString(),
          open: true
        };
        db.get().collection('issues').insertOne(issue, (err, data) => {
          res.json(data.ops[0]);
        });
      });
    })

    .put(function (req, res){
      if (!req.body._id)
        return res.send("Please provide all required fields");
      var updateFields = Object.keys(req.body).filter(field => req.body[field] !== "" && validFields.includes(field));
      if (updateFields.length == 0)
        return res.send("no updated field sent");
      var update = {};
      updateFields.forEach(f => {
        update[f] = req.body[f];
      });
      update.updated_on = (new Date()).toISOString();
      db.connect(CONNECTION_STRING, function() {
        db.get().collection('issues').findOneAndUpdate(
          {_id: req.body._id},
          {$set: update},
          (err, data) => {
            if (err) {
              return res.send("could not update "+req.body._id);
            } else {
              return res.send("successfully updated");
            }
          }
        );
      });
    })

    .delete(function (req, res){
      if (!req.body._id)
        return res.send("_id error");
      db.connect(CONNECTION_STRING, function() {
        db.get().collection('issues').deleteOne({_id: req.body._id}, function(err, data) {
          if (err)
            return res.send("could not delete "+req.body._id);
          else
            return res.send("deleted "+req.body._id);
        });
      });
    });
    
};
