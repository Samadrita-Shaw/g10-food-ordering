#!/bin/bash

# MongoDB Data Inspection Script for Food Ordering Application
# Run this script to check MongoDB data and status

echo "=== MongoDB Container Status ==="
docker ps | grep mongo

echo ""
echo "=== Available Databases ==="
docker exec food-ordering-mongodb mongosh --username admin --password password --authenticationDatabase admin --quiet --eval "show dbs"

echo ""
echo "=== Collections in food_ordering_users ==="
docker exec food-ordering-mongodb mongosh --username admin --password password --authenticationDatabase admin --quiet --eval "use food_ordering_users; show collections"

echo ""
echo "=== User Count ==="
docker exec food-ordering-mongodb mongosh --username admin --password password --authenticationDatabase admin --quiet --eval "use food_ordering_users; db.users.countDocuments()"

echo ""
echo "=== Sample User Data (First 2 users) ==="
docker exec food-ordering-mongodb mongosh --username admin --password password --authenticationDatabase admin --quiet --eval "use food_ordering_users; db.users.find({}, {password: 0}).limit(2).forEach(printjson)"

echo ""
echo "=== User Statistics ==="
docker exec food-ordering-mongodb mongosh --username admin --password password --authenticationDatabase admin --quiet --eval "
use food_ordering_users;
print('Total users: ' + db.users.countDocuments());
print('Active users: ' + db.users.countDocuments({isActive: true}));
print('Inactive users: ' + db.users.countDocuments({isActive: false}));
print('Users by role:');
db.users.aggregate([{$group: {_id: '$role', count: {$sum: 1}}}]).forEach(function(result) {
  print('  ' + result._id + ': ' + result.count);
});
"

echo ""
echo "=== Recent Users (Last created) ==="
docker exec food-ordering-mongodb mongosh --username admin --password password --authenticationDatabase admin --quiet --eval "use food_ordering_users; db.users.find({}, {password: 0}).sort({createdAt: -1}).limit(3).forEach(printjson)"
