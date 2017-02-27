//REQUIRES
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var bower = require('gulp-bower');
var standard = require('gulp-standard');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var useref = require('gulp-useref');

//VARIABLES
var name = "ngWebRTC"
var workdir = "./src"
var build_dir = "./dist"
var project_js_dirs = [ workdir + '/js/**/**.js', workdir + 'js/**.js']

//TASKS
gulp.task('default', ['build'])
gulp.task('build', ['bower', 'standard', 'uglify-js'])
gulp.task('run', ['http'])
gulp.task('uglify-js', uglifyJS_task);
gulp.task('standard', standard_task);
gulp.task('bower', bower);

////

function standard_task(){
    gulp.src(project_js_dirs)
	.pipe(standard())
	.pipe(standard.reporter('default',{
	    breakOnError: true,
	    quiet: true
	}));
}

function uglifyJS_task(){
    gulp.src(project_js_dirs)
    	.pipe(useref())
			.pipe(uglify())
	.pipe(concat(name + '.js'))
	.pipe(gulp.dest(build_dir + '/js/'));
}
