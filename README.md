# Welcome to StackEdit!
MQ-Models is a set of base models for MQ's Team server.
MQ-Models runs on **Adonisjs 4**, **lucid-mongo**.
It rewrites the relational definitions in models and functions to extend and query the mongoDB more easily.
Lucid mongo: https://github.com/duyluonglc/lucid-mongo

# Install

# Using
### Relations
This package support relations like lucid-mongo:

 - belongsTo 
 - belongsToMany 
 - hasMany 
 - hasManyThrough 
 - hasOne 
 - morphMany
 - morphTo 
 - morphOne  
 - embedsOne 
 - embedsMany 
 - referMany
#### Addition relations
sử dụng hàm relationships để khai báo các quan hệ, nó có cấu trúc dạng:

    static get relationships() {
	    return {
		    <relationName1>:{
			    <relatedName1>: [<Model Related 1>, <localField>, <ForeginField>],
			    <relatedName2>: [<Model Related 2>, <localField>, <ForeginField>],
		    },
		    <relationName2>:{
			    <relatedName3>: [<Model Related 3>, <localField>, <ForeginField>],
			    <relatedName4>: [<Model Related 4>, <localField>, <ForeginField>],
		    },
	    }
    }

Example:


    const Model =  use('MQ-Models')
    class  User  extends  Model {
	    static  get relationships() {
		    return {
				hasMany: {
					tokens: ['App/Models/Token', '_id', 'userId']
				},
				referMany: {
					roles: ['App/Models/Role', '_id', 'roleIds'],
					permissions: ['App/Models/Permission', '_id', 'permissionIds']},
				}
			}
		}
		.....
	}


### Query
Same as Lucid-mongo & mquery:

        const users =  await User.all()
        const users =  await User.where('name', 'peter').fetch()
        const users =  await User.where({ name: 'peter' })
      .limit(10).skip(20).fetch()
    
	    const users =  await User.where({
		  $or: [
	        { gender: 'female', age: { $gte: 20 } }, 
	        { gender: 'male', age: { $gte: 22 } }
	      ]
	    }).fetch()
    
	    const user =  await User
	      .where('name').eq('peter')
	      .where('age').gt(18).lte(60)
	      .sort('-age')
	      .first()
    
	    const users =  await User
	      .where({ age: { $gte: 18 } })
	      .sort({ age: -1 })
	      .fetch()
    
	    const users =  await User
	      .where('age', '>=', 18)
	      .fetch()
	    
	    const users =  await User
	      .where('age').gt(18)
	      .paginate(2, 100)
	    
	    const users =  await User.where(function() {
	      this.where('age', '>=', 18)
	    }).fetch()
    
    // to query geo near you need add 2d or 2dsphere index in migration file
	    const images = await Image
	      .where(location)
	      .near({ center: [1, 1] })
	      .maxDistance(5000)
	      .fetch()
	    
	    const images = await Image
	      .where(location)
	      .near({ center: [1, 1], sphere: true })
	      .maxDistance(5000)
	      .fetch()
    
    [More Documentation of mquery](https://github.com/aheckmann/mquery)
    
    ### [](https://github.com/duyluonglc/lucid-mongo#aggregation)Aggregation
    
      // count without group by
      const count = await Customer.count()
    
      // count group by `position`
      const count_rows = await Customer
        .where({ invited: { $exist: true } })
        .count('position')
    
      // max age without group by
      const max = await Employee.max('age')
    
      // sum `salary` group by `department_id`
      const total_rows = await Employee
        .where(active, true)
        .sum('salary', 'department_id')
    
      // average group by `department_id` and `role_id`
      const avg_rows = await Employee
        .where(active, true)
        .avg('salary', { department: '$department_id', role: '$role_id' })


## Aggregation
MQ-Models hỗ trợ aggregation.
sử dụng fetchAggregate() hoặc aggregate([....]) 

Example:

    const users = await User.with('emails').fetchAggregate()
     const users = await User.with('emails').aggregate([
	     $match: {
		     username: /ngoc/i
	     },
	     $unwind: {
		     path: 'emails',
		     preserveNullAndEmptyArrays: true
	     }
	])
	//or
	const users = await User.with('emails').where({username: "ngoc"}).fetchAggregate()
	
More: https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/
#### Auto unwind
By default, auto-unwind supports aggragation with dependencies: belongsTo,
  hasOne, embedsOne, morphOne.
You can add more by overriding the autoUnwind function below:

    static  get autoUnwind(){
	    return [
		    "belongsTo",
		    "hasOne",
		    "embedsOne",
		    "morphOne"
		]
	}

NgocHip
