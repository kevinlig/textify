require.config({ 
    paths: {
        text: "vendor/text",
        jquery: "vendor/jquery",
        underscore: "vendor/underscore-min", 
        backbone: "vendor/backbone-min",
        handlebars: "vendor/handlebars",
        foundation: "vendor/foundation.min",
        moment: "vendor/moment.min",
        scrollTo: "vendor/jquery.scrollTo.min",
        spin: "vendor/spin.min"
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
        scrollTo: {
            deps: ['jquery']
        }

    }
}); 

require([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'foundation',
    'app/app',
    'scrollTo'
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