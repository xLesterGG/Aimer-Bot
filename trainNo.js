var fs = require('fs');
var bayes = require('bayes');
var readline = require('readline');
var classifier = bayes();

if (fs.existsSync("naive.txt")) {
    classifier = bayes.fromJson(fs.readFileSync('naive.txt', 'utf8'));
    console.log("loaded bayes from json");

    var rd = readline.createInterface({
        input: fs.createReadStream('new.txt')
    });

    rd.on('line', function(line) {
        classifier.learn(line, 'negative')
    });

}
else{
    console.log("classifier file not found");
}

fs.writeFile("naive.txt",classifier.toJson(), function(err) {
    if(err) {
        return console.log(err);
    }
});


console.log("Training done");
