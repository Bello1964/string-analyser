// ============
// requirements
// ============

var express  = require ("express"),
    app      = express(),
    mongoose = require("mongoose"),
    crypto   = require("crypto"),
    dotenv   = require ("dotenv").config();

    app.use ( express.json());
    app.use (express.urlencoded({extended :true}));

// =========================================================
// Config DB
// =========================================================
url_db= process.env.db;
(async ()=>{try { await mongoose.connect(url_db);
    console.log ("DB connected successfully to: "+ mongoose.connection.name);
}
catch (err)
{console.log(err.message);
    process.exit(1);
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

// StringData_schema.set("toJSON",{
//    transform: (doc, ret)=> {
//     return {
//     id             : ret.id,
//     value          : ret.value,
//     properties     : ret.properties,
//     created_at     : ret.created_at
//     };
//    } 
// } );

StringData = mongoose.model("StringData", StringData_schema);


// =================================
// ROUTES
// =================================

app.post ("/strings", async (req, res) => {
  try
    {
       // defining values
      if (typeof req.body.value !== 'string'|| typeof req.body.value === "undefined")
        {res.status(422).json("422 Unprocessable Entity: Invalid data type for 'value' (must be string)");
            console.error("Invalid data type for 'value' (must be string)");  process.exit(1);
        }  else  if(!req.body.value ){res.status(400).json("400 Bad Request: Invalid request body or missing  'value' field");
    console.error("Invalid request body or missing  'value' field"); process.exit(1);
      }
    value                  = req.body.value.toLowerCase(),
    id                     = crypto.createHash("sha256").update(value).digest("hex"),
    created_at             = new Date().toISOString(),
    length                 = value.length;
     unique                = (val)=> {uni= new Set (val); return uni.size;};
    unique_characters      = unique(value);
    splittedValue          =value.split("");
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
        j= "-" + (i + 1);
        is_palindrome = true;
        if (splittedValue[i]!== splittedValue[j]){
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
    created_at     : created_at
    };
    // writing error statuses
    found = await StringData.findOne({value: value})
if (found && value === found.value)
     { res.status(409).json("409 Conflict: String already exists in the system");
        console.error("String already exists in the system"); process.exit(1);
      }  else {
    try {stringData = ((await StringData.create(data)));

        // delete stringData.__v && delete stringData._id;
        console.log(stringData);}
    catch(err){console.log("error saving!" + err)}
    res.status (201).json(stringData.toObject());
}
}
    catch (err) { 
    console.error (err);
    res.send("Error!");
   } }
 );


//  get spec string
app.get("/strings/:value", async (req, res)=> {
try {
    found = await StringData.findOne({value: req.params.value})
    // Error Handling
    if (found){
    res.status(200).json (found.toObject());}
    else {
        console.error("404 Not Found: Inputted value does not exist");
        res.status(404).json("404 Not Found: Inputted value does not exist");
    }
}catch (err){console.log(err);}
    }
);

// app.get("/strings", async (req, res)=>{
//   try {
//     params= req.query;
//     validquery= "is_palindrome"||"min_length"||"max_length"||"word_count"||"contains_character";
//     if (!params[validquery]){
//         console.log ("Invalid query parameter values or types");
//         res.status(400).json("400 Bad Reequest: Invalid query parameter values or types");
//         process.exit(1);
//     }
//     founds=[];
//     if (params.min_length){ 
        
//         for (i= 1; i< params.max_length; i++)
//         {found = await StringData.find({length: i});
//         founds.push(...found) ;}
//         res.status(200).json(founds);
//     } if (params.max_length){
//         for (i= 100; i> params.max_length; i++)
//         {found = await StringData.find({length: i});
//         if (!founds[0]){
//         founds.push(...found) ;}
//         else {
//             found[0]
//             founds[0].
//         }
//     }
//         res.status(200).json(founds); 
//     // } if (params.min_length&& params.max_length){
//     //     founds=[]
//     //     for (i= params.min_length; i< params.max_length; i++)
//     //     {found = await StringData.find({length: i});
//     //     founds.push(...found) ;}
//     //     res.status(200).json(founds);
//     }  if (params.contains_character){ 
//         pattern= new RegExp (params.contains_character, "i");
//         founds= await StringData.find({value: pattern});
//         res.status(200).json(founds);
//     }
//     if (!params.max_length&&params.min_length) {
//         founds= await StringData.find(params);
//         res.status(200).json(founds);
//     }
//   }
//   catch(err){
//     console.log(err);
//     res.json(err);
//   }
// })




port = 3000 || process.env.port;
app.listen (port, console.log ("Server running on port: " + port));