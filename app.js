// ============
// requirements
// ============


var express  = require ("express"),
    app      = express(),
    mongoose = require("mongoose"),
    crypto   = require("crypto"),
    dotenv   = require ("dotenv").config();
const methodOverride= require("method-override"),
      path          = require("path");

    app.use ( express.json());
    app.use (express.urlencoded({extended :true}));
    app.use (methodOverride("-method"));
    app.use (express.static(path.join(__dirname, "public")));

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

// =========================================================
// Config DB
// =========================================================
url_db= process.env.dbl;
(async ()=>{try { await mongoose.connect(url_db);
    console.log ("DB connected successfully to: "+ mongoose.connection.name);
}
catch (err)
{console.log(err.message);
    // process.exit(1);
}})();

// FORGETTING PREVIOUS MODEL CACHE
if (mongoose.models.StringData)
{delete mongoose.models.StringData;}

// defining schema
StringData_schema = new mongoose.Schema ({
    id             : String,
    value          : String,
    properties     : {
        Character_frequency_map: Object,
        sha256_hash: String,
        word_count : Number,
        unique_characters: Number,
        is_palindrome    : Boolean,
        length     : Number
    },
    created_at     : String
}
,
{toObject:{
    transform:(doc, ret)=>{delete ret._id; delete ret.__v;},}, },
{toJSON: {
    transform: (doc, ret)=>{ delete ret._id; delete ret.__v;},},}
);


StringData = mongoose.model("StringData", StringData_schema);



// ========================
// Middleware
// ========================


app.use((req, res, next)=> {
    res.locals.page= null;
    next();
}); 


// =================================
// ROUTES
// =================================

app.post ("/strings", async (req, res) => {
  try
    {
       // defining values
      if (typeof req.body.value !== 'string'|| typeof req.body.value === "undefined")
        {res.status(422).json("422 Unprocessable Entity: Invalid data type for 'value' (must be string)");
            // console.log(typeof req.body.value);
            // console.error("Invalid data type for 'value' (must be string)"); 
        }  else  if(!req.body.value ){res.status(400).json("400 Bad Request: Invalid request body or missing  'value' field");
    // console.error("Invalid request body or missing  'value' field"); process.exit(1);
      }

    const getWATDate = () => {
  return new Date().toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};
    value                  = req.body.value.toLowerCase(),
    id                     = crypto.createHash("sha256").update(value).digest("hex"),
    created_at             = getWATDate(),
    length                 = value.length;
    unique                 = (val)=> {uni= new Set (val); return uni.size;};
    unique_characters      = unique(value);
    splittedValue          = value.split("");
    word_count         = value.trim().split(/\s+/).length;
    sha256_hash            = id;
    obj                    = {};
    //Character_frequency_map  
    splittedValue.forEach (i => {
        if (obj[i]){obj[i] = obj[i] + 1;}
            else {obj[i]= 1;}
       Character_frequency_map =  obj;
    })
    for (i =0; i < (splittedValue.length)/2; i++){
        j= - (i + 1);
        is_palindrome = true;
        if ( splittedValue[i]!== splittedValue.at(j)){
            is_palindrome= false;
            break;
        }
    }
    
    


    //create our string-Data
    data  =   {
    id             : id,
    value          : value,
    properties     : {
        Character_frequency_map,
        sha256_hash: sha256_hash,
        word_count : word_count,
        unique_characters: unique_characters,
        is_palindrome    : is_palindrome,
        length     : length
    },
    created_at     : created_at,
    timeStamp      : new Date()
    }; 
    // writing error statuses
    found = await StringData.findOne({value: value})
if (found && value === found.value)
     { res.status(409).json(
"409 Conflict: String already exists in the system. Navigate backward to make a change!");
      }  else {
    try {stringData = ((await StringData.create(data)));



        // delete stringData.__v && delete stringData._id;
        
    }
    catch(err){console.log("error saving!" + err.message)}
    // res.status (201).json(stringData.toObject());
    res.status(200).redirect("/Strings");
}
}
    catch (err) { 
        console.log(err.message)
    res.send("Error accessing the server!");
   } }
 );
// ===============
// EJS  ROUTES
// ===============


//  Landing Page

app.get ("/",  (req, res)=>{
  res.render("landing", {display: true});
})

app.get ("/Analyse",  (req, res)=>{
  res.render("Analyse");
})


//  get spec string
app.get("/strings/:value", async (req, res)=> {
try {
    if (req.params.value){
     let vari   = req.params.value;
     let regex  = new RegExp(`\\b\\w*${vari}\\w*\\b`, "i");
     let founds = await StringData.find({"value": regex});
    
    // Error Handling
    if (founds.length <= 0){
        // console.log("404 Not Found: Inputted value does not exist"); 
        res.status(404).json("404 Not Found: Inputted value does not exist");
    } else {
     var data       = [...founds].reverse();
     var response   = {
        data          :data,
        count         :data.length,
        filter_applied: "Word search"
    };  
    
    res.status(200).render('partials/stringCards', {response});} }
}catch (err){console.log(err.message);
    res.status(500).json({Error: err.message});}
    });

app.get("/strings", async (req, res)=>{if (Object.keys(req.query).length <1) {
   try{ 
founds= await StringData.find({});

    // preparing response object
    var data      = [...founds].reverse(),
        response  = {
        data          :data,
        count         :data.length,
        filter_applied:"None" 
    };

    if(!res.headersSent){
    res.render('Saved', {page: "savedStrings", response});
}
    //    res.status(200).json(response);
} catch(err){
    res.status(500).json(err.message)
}
} else {
  try {
    // variables declaration
    var founds      =[],
        params      = req.query,
        pastquery   = [];
    var validquery   = params.is_palindrome||params.min_length||params.max_length||params.word_count||params.contains_character;
    if ( !validquery){
        // console.log ("Invalid query parameter values or types");
        res.status(400).json("400 Bad Request: Invalid query parameter values or types");
    } else{
    try {
    function filtered (founds, results){
            filterResult= [];
            for (found of founds) {
                for (result of results){
                if (found.value ===result.value){
                   filterResult.push(found);
                }};
            };
            // console.log(filterResult);
           return filterResult;}
           var vari= params.max_length;
    if (vari){ var result= [];
        for (i=0;i<vari;i++) {
            var found = await StringData.find({"properties.length": i}),
               result= (result||[]).concat(found||[]);}
           founds= result;
           var pastquery= [vari];
    }
    if (vari= params.min_length){ var result=[];
        for (i=500;i>vari;i--) {
           var found = await StringData.find({"properties.length": i});
           result= (result||[]).concat(found||[]);
    }
         if (pastquery.length===0){ founds= result; } else{
            founds= filtered (founds, result);
         } 
         var pastquery= (pastquery||[]).concat([vari]);
    }
    if (vari= params.contains_character){
          let regex= new RegExp(`\\b\\w*${vari}\\w*\\b`, "i");
          let result= await StringData.find({"value": regex});
         if (pastquery.length===0){ founds= result; } else{
            founds= filtered (founds, result);
         } 
         var pastquery= (pastquery||[]).concat([vari]); 
    } 
    if (vari= params.is_palindrome){
        let result= await StringData.find({"properties.is_palindrome": (params.is_palindrome)}); 
         if (pastquery.length===0){ founds= result; } else{
            founds= filtered (founds, result);
         } 
         var pastquery= (pastquery||[]).concat([vari]);
    }
    if (vari= params.word_count){
        let result= await StringData.find({"properties.word_count": vari});
         if (pastquery.length===0){ founds= result; } else{
            founds= filtered (founds, result);
         } 
         var pastquery= (pastquery||[]).concat([vari]);
    }

    // preparing response object
    var data           = [...founds].reverse(),
        response= {
        data          :data,
        count         :data.length,
        filter_applied: params
    };
    //    Return response);
    //    res.status(200).json(response);

    if(!res.headersSent){
    res.render('partials/stringCards', {page: "savedStrings", response});
}
      }
      catch(err){
        res.status(500).json(err.message);
      }
    }} catch(err) {console.error (err.message);}
}

});



app.delete("/strings/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  const deleted = await StringData.findByIdAndDelete(id);

  if (!deleted) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.sendStatus(200);
});

port = process.env.PORT || 3000;
app.listen (port, console.log ("Server running on port: " + port));