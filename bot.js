var twit = require('twit');
var config = require('./config.js');
var fs = require('fs');
var bayes = require('bayes');
var readline = require('readline');
var moment = require('moment');
var franc = require('franc');



var classifier = bayes();
var Twitter = new twit(config);


// var http = require('http');
//
// //create a server object:
// http.createServer(function (req, res) {
//   res.write('Hello World!'); //write a response to the client
//   res.end(); //end the response
// }).listen(process.env.PORT || 5000) //the server object listens on port 5000



var retweet = (retweetId,content)=>{

    Twitter.post('statuses/retweet/:id',{id:retweetId},(err,res)=>{
        if(res){
            console.log("retweeted "+ retweetId+ " - " + content + "at "+ moment().format('MMMM Do YYYY, h:mm:ss a')+'\n');
        }else{ // if retweeting went wrong
            console.log("Something went wrong when retweeting");
        }
    });
};

var search = ()=>{
    var params = {
        q: 'aimer',// your query
        result_type:'recent',  //mix of popular and recent
        count:'5'
    }

    Twitter.get('search/tweets',params,(err,data)=>{
        if(!err){

            var tweets = [];
            for(var i =0; i<data.statuses.length;i++){

                // data.statuses[i].user.name
                // console.log(i+1+". "+data.statuses[i].text.replace(/(\r\n|\n|\r)/gm,"")+ "\n");
                // fs.appendFileSync("fr.txt",data.statuses[i].text.replace(/(\r\n|\n|\r)/gm,"") +"\n");
                var c = data.statuses[i].text.replace(/(\r\n|\n|\r)/gm,"");

                if(c.split(' ')[0].toLowerCase().includes("aimer") && c.split(' ')[0].charAt(0)=="@" && c.split(' ')[0]!="@Aimer_and_staff"){
                    console.log(c + "before");
                    c = c.substr(c.indexOf(" ") + 1);
                    console.log(c+"after");
                }

                tweets[i] = {
                    id:data.statuses[i].id_str,
                    content:c
                };
            }

            for(var x = 0; x<tweets.length;x++){
                // console.log(classifier.categorize(tweets[x].content) +"   "+ tweets[x].content );
                if(franc(tweets[x].content)=="fra"){
                    console.log(tweets[x].content +"is fr,negative and will be used to train, and update model \n");
                    classifier.learn(tweets[x].content, 'negative');

                    fs.writeFile("naive.txt",classifier.toJson(), function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    });
                }else{
                    if(classifier.categorize(tweets[x].content) == "positive"){

                        if(tweets[x].content.toLowerCase().includes("aimer")||tweets[x].content.includes("エメ")){
                            console.log(tweets[x].id+ " - " + tweets[x].content + "is positive and will be used to train, and update model \n");

                            classifier.learn(tweets[x].content, 'positive');
                            fs.writeFile("naive.txt",classifier.toJson(), function(err) {
                                if(err) {
                                    return console.log(err);
                                }
                            });

                            retweet(tweets[x].id,tweets[x].content);
                        }
                        else{
                            console.log(tweets[x].id+ " - " + tweets[x].content + "is negative and will be used to train, and update model \n");
                            classifier.learn(tweets[x].content, 'negative');

                            fs.writeFile("naive.txt",classifier.toJson(), function(err) {
                                if(err) {
                                    return console.log(err);
                                }
                            });
                        }

                    }
                }
            }

            // console.log(tweets);

        }else{ //if cannot search
            console.error("Something went wrong");
            console.error(err);
        }
    });
};


var trainingP = ()=>{
    var rd = readline.createInterface({
        input: fs.createReadStream('to.txt')
    });

    rd.on('line', function(line) {
        // console.log(line);
        classifier.learn(line, 'positive')
    });
};

var trainingN = ()=>{
    var rd = readline.createInterface({
        input: fs.createReadStream('no.txt')
    });

    rd.on('line', function(line) {
        classifier.learn(line, 'negative')
    });
};

if (fs.existsSync("naive.txt")) {
    console.log("loading model from json");

    classifier = bayes.fromJson(fs.readFileSync('naive.txt', 'utf8'));
}
else{
    console.log("training from dataset");
    trainingP();
    trainingN();
}


search();

// setInterval(search, 30000);

setInterval(search, 60000);
