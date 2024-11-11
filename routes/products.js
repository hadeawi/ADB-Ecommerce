var express=require('express');
var router=express.Router();
var mongoose=require('mongoose');
var fs=require('fs-extra');
var auth=require('../config/auth');
var isUser=auth.isUser;
const logUserActivity = require('../services/activity.service')

//get models
var Schema2=require('../models/product')
var Product= mongoose.model("products",Schema2);

var Schema3 = require('../models/activity')
const Activity = mongoose.model("activities",Schema3);

//get Category model
var Schema=require('../models/category')
var Category= mongoose.model("categories",Schema);

/*
* GET all products 
*/
router.get('/', async function(req,res){
    console.log(req.cookies.username)
    await Product.find(function(err,products){
        if(err){
            console.log("error in router.get('/) in products.js "+err);
        }
            res.render('all_products',{
                title:'All products',
                products:products
            });
        
        });

    });

/*
* GET recommended 
*/
router.get('/recommended', async function (req, res) {
    const currentUserId = req.user._id;

    let activities = await Activity.find({ userId: currentUserId });
    let productIds = activities.map(activity => activity.productId);

    let categories = [];
    for (let productId of productIds) {
        const product = await Product.findById(productId);
        if (product && product.category) {
            categories.push(product.category);
        }
    }

    const categoryCount = {};
    categories.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    //sort by popularity
    const sortedCategories = Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a]);

    //purchased products 
    const purchasedActivities = await Activity.find({ userId: currentUserId, activityType: "purchase" });
    const purchasedProductIds = purchasedActivities.map(activity => activity.productId.toString());

    //exclude purchased 
    let recommendedProducts = [];
    for (let category of sortedCategories) {
        const productsInCategory = await Product.find({ category });
        recommendedProducts.push(...productsInCategory.filter(product => !purchasedProductIds.includes(product._id.toString())));
    }

    recommendedProducts = recommendedProducts.slice(0, 20);

    res.render('recommended_products', { title: "Recommended products", products: recommendedProducts });
});


/*
* GET all products  by category
*/

router.get('/:category',async function(req,res){

        let categorySlug = req.params.category;
        console.log(categorySlug)
  await   Category.findOne({slug :categorySlug},function(err,c){
    Product.find({category:categorySlug},function(err,products){
        if(err){
            console.log("error in router.get('/:category) in products.js "+err);
        }
            res.render('cat_products',{
                title:c.title,
                products:products
            });
        
        });
    });
})

router.post('/search', async function(req, res) {
    const query = req.body.query;
    console.log('Search Query:', query);  // Add this line for debugging
    
    try {
        const products = await Product.find({ title: { $regex: query, $options: 'i' } });
        res.render('search_results', {
            title: `Search results for "${query}"`,
            products: products,
            query: query,
            user: req.user
        });
    } catch (err) {
        console.log("Error in router.get('/search') in products.js: " + err);
        res.status(500).send("Internal Server Error");
    }
});

/*
* GET all products details
*/
router.get('/:category/:product',async function(req,res){
    var galleryImages=null;
    var loggedIn=(req.isAuthenticated()) ? true :false;
   await Product.findOne({slug:req.params.product}, async function(err,product){
        await logUserActivity(req.user._id, product._id, 'view');
        if(err){
            console.log("err in /:category/:product in products.js"+err);
        }else{
            var galleryDir='public/product_images/'+product._id+'/gallery';
            fs.readdir(galleryDir,function(err,files){
                if(err){
                    console.log("error in /:category/:product in fs readir"+err);
                }else{
                        galleryImages=files;
                        res.render('product',{
                            title:product.title,
                            p:product,
                            galleryImages:galleryImages,
                            loggedIn:loggedIn
                        });
                }
            });
        }
    });
});


module.exports=router;