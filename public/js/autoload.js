require.config({ 
    paths: { 
        jquery: "vendor/jquery",
        underscore: "vendor/underscore-min", 
        backbone: "vendor/backbone-min",
        handlebars: "vendor/handlebars",
        foundation: "vendor/foundation.min"
    },
    shim: {
        backbone: {
            deps: ['jquery','underscore','handlebars'],
            exports: 'Backbone'
        },
        foundation: {
            deps: ['jquery'],
            exports: 'foundation'
        },
        underscore: {
            exports: '_'
        },

    }
}); 

require([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'foundation',
    'app/app'
    ], 
    function($,_, Backbone, handlebars, foundation, App){
        $(document).ready(function(){
            // start foundation as well, but only once the DOM is in place
            $(document).foundation();

            // start the backbone app
            window.app = new App;
            app.init();
        });
    }
);