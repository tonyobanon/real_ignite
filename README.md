## Real Ignite

<img src="https://travis-ci.org/tonyobanon/real_ignite.svg?branch=master">

Real Ignite is a full stack messaging app that end-users can use to reliably send emails to friends and colleagues. It abstracts multiple email service providers that are used behind the scenes . It also ships with features that enables the user to store drafts, track sent items, and view a simple dashboard of his activity. The UI is simple and interactive, and users are able to construct emails using an integrated WYSIWYG editor. 

## Setup
To setup this project locally:
- Clone the repository:
 `git clone git@github.com:tonyobanon/real_ignite.git`
- Update the `.env` file with your credentials and API keys
- Start the docker container
 `bin/local_start_all.sh`
- Visit `localhost:8000` to start sending emails
- To access the metrics dashboard and graphs, visit `localhost:9000`


## Architecture

### Database
MySQL database is used to store persistent data including basic user information and email messages. Migration scripts may be added to the `migrations` folder.

### Caching
Redis is used as the primary cache. In the application, It is used to store metadata for uploaded attachments.

### User Interface
The UI is a single page application based on Google Material Design. A custom rendering library is also integrated to manage life cycles for each view. Our custom renderer is based on the principle that a single view can exist independent of the page at large, and can have multiple contexts that are transparent across all views. JQuery is used for DOM traversal.
All views are declared in a `.view` file, and are dynamically inserted into the page at runtime.
Also, client assets (images, stylesheets, scripts, views) exists in the `assets` folders, and several gulp tasks minify these assets and extract them to the `public` folder from where they are served up.

### Metrics and Analytics
Our application heavily submits metric data at various application tiers. We use graphite to visualize data collected and run graph functions.

### Authentication
The application rely on third party OAuth providers to retrieve basic information about the user. After successful login, a Jwt token is issued and used for future requests. No token, or session data is stored on the server. All tokens are available as cookies on the user's browser. On token generation, a timeout is set, after which the token becomes invalid.

### Logging
A centralized logger is used across the entire application.

### Dependency Injection
The application uses the Service Locator Pattern to resolve dependencies, and encapsulate the processes involved in obtaining a service with a strong abstraction layer. 
> See `app/config/di` and `app/lib/service_locator`

### Tests
Some unit tests are available in the `__tests__/unit` folder, part of which was recently migrated from Mocha and Chai to Facebook Jest. 

### Coding Standard
As much as possible, modern ES8 syntax, including `async` and `await`, is used on the server side. However, given more time, client javascript will be ported to modern ES syntax and transpiled using babel.

<!-- 
###  Continuous Integration
On push, a build is triggered on Travis CI. Our deployment pipeline is fully integrated with our development flow, such that merges to the master branch triggers a production deploy to Google App Engine, after end -to-end tests have been run. -->

## Things I left out
- Website SSL
- Html5 pushState (for the client)
- Swagger API docs
- Proper user timezone synchronization
- A service layer to properly orchestrate caching for most model operations (Very important)
- Submitting metrics for database operations in models
- Full test coverage


###  About Me
My name is Anthony. I am a Software Engineer, with experience in building scalable systems. In my free time I work on personal projects or read about software engineering trends. I always want to learn new things.
