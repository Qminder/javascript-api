module.exports = function(grunt) {

  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"dd-mm-yyyy\") %> */\n"
      },
      dist: {
        files: {
          "dist/qminder-api.min.js": "src/qminder-api.js",
          "dist/qminder-bridge.min.js": "src/qminder-bridge.js"
        }
      }
    },
    jshint: {
      files: ["Gruntfile.js", "src/**/*.js", "test/**/*.js"],
      options: {
        camelcase: true,
        curly: true,
        indent: 2,
        latedef: false,
        newcap: true,
        noarg: true,
        noempty: true,
        nonew: true,
        quotmark: "double",
        unused: true,
        strict: true,
        trailing: true,
        maxdepth: 3,
        globals: {
          console: true,
          XMLHttpRequest: true,
          XDomainRequest: true
        }
      }
    },
    
    karma: {
      unit: {
        configFile: "karma.conf.js"
      }
    },
    
    watch: {
      scripts: {
        files: ["src/*.js", "test/*.js"],
        tasks: ["jshint", "uglify", "jasmine"],
        options: {
          spawn: false,
        },
      },
    },
    clean: ["temp-secret.js"]
  });

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-karma");
  
  grunt.file.write("temp-secret.js", "QMINDER_SECRET_KEY=\"" + process.env.QMINDER_SECRET_KEY + "\";");


  grunt.registerTask("tests", ["jshint", "uglify", "karma", "clean"]);
  grunt.registerTask("travis", ["tests"]);
  grunt.registerTask("default", ["jshint"]);

};
