import EmberRouter from "@ember/routing/router";
import config from "./config/environment";

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route("login");
  this.route("signup");
  this.route("messages");
  this.route("home", { path: "/" });
  this.route("tracker", function () {
    this.route("day", { path: "/day/:id" });
  });
  this.route("not-found", { path: "/*path" });
  this.route("charge-codes");
});
