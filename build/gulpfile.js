var gulp = require('gulp');
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var browserSync = require('browser-sync').create();
var parameters = require('../config/parameters.js');
var awsconfig = require('../config/awsconfig.json');
var awspublish = require('gulp-awspublish');

var gulpLoadPlugins = require('gulp-load-plugins');
var $ = gulpLoadPlugins();

//browserSync.use(require('bs-snippet-injector'), {
	//file: parameters.footer_path
//});

gulp.task('browser-sync', ['styles'], function() {
	browserSync.init({
		port: 8000,
		server: {
			baseDir: parameters.web_path
		}
	});
});

gulp.task('move-assets', function() {
	return gulp.src([parameters.app_path + '/index.html', parameters.app_path + '/assets/asyncjs/*', parameters.app_path + '/assets/img/*', parameters.app_path + '/assets/fonts/*/**'], {
		base: parameters.app_path
	})
	.pipe(gulp.dest(parameters.web_path));
});

gulp.task('lint', ['babel'], function() {
	return gulp.src(parameters.tmp_path + '/js/' + parameters.app_main_file)
	.pipe($.jshint())
	.pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('babel', function() {
	return browserify({
		entries: parameters.assets_path + '/js/main.js',
		debug: true
	})
	.transform(babelify)
	.bundle()
	.pipe(source(parameters.app_main_file))
	.pipe(gulp.dest(parameters.tmp_path + '/js'));
});

gulp.task('vendor', function() {
	return gulp.src(parameters.vendor_path + '/**/*.js')
	.pipe($.concat(parameters.vendor_main_file))
	.pipe(gulp.dest(parameters.tmp_path + '/js'));
});

gulp.task('styles', function() {
	return gulp.src(parameters.styles_main_file)
	.pipe($.sass())
	.on('error', function(err) {
		console.log(err.message);
		this.emit('end');
	})
	.pipe($.autoprefixer({
		browsers: 'last 2 versions'
	}))
	.pipe($.minifyCss())
	.pipe(gulp.dest(parameters.web_path + '/assets/css'))
	.pipe(browserSync.stream());
});

gulp.task('minify', ['vendor', 'babel'], function() {
	return gulp.src([parameters.tmp_path + '/js/vendor.js', parameters.tmp_path + '/js/main.js'])
	.pipe($.sourcemaps.init())
	.pipe($.concat('app.min.js'))
	// .pipe($.uglify())
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest(parameters.web_path + '/assets/js'));
});

gulp.task('bs-reload', ['minify'], function() {
	return browserSync.reload();
});

gulp.task('watch', function() {
	gulp.watch(parameters.assets_path + '/**/*.js', ['bs-reload']);
	gulp.watch(parameters.assets_path + '/**/*.scss', ['styles']);
	gulp.watch(parameters.app_path + '/**/*.html', ['bs-reload']);
});

gulp.task('publish', function() {
 
  // create a new publisher using S3 options 
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property 
  var publisher = awspublish.create(awsconfig);
 
  // define custom headers 
  var headers = {
    'Cache-Control': 'max-age=315360000, no-transform, public'
    // ... 
  };
 
  return gulp.src('public/**')
     // gzip, Set Content-Encoding headers and add .gz extension 
    .pipe(awspublish.gzip())
    //.pipe(awspublish.gzip({ ext: '.gz' }))
 
    // publisher will add Content-Length, Content-Type and headers specified above 
    // If not specified it will set x-amz-acl to public-read by default 
    .pipe(publisher.publish(headers))
 
    // create a cache file to speed up consecutive uploads 
    .pipe(publisher.cache())
 
     // print upload updates to console 
    .pipe(awspublish.reporter());
});



gulp.task('default', ['move-assets', 'styles', 'minify', 'watch', 'browser-sync']);
