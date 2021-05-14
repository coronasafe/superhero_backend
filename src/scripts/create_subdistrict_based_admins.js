const jsonExport = require('jsonexport')
const fs = require('fs')
const path = require('path');

const plbModel = require("../models").plb;
const districtModel = require("../models").district;
const UserModel = require("../models").user;
const Commons = require("../utils/Commons");


async function generateUsersBasedOnSubDistrict({districtID, subDistrictID, stateID}) {
    const subDistrictData = await returnListOfSubDistricts({districtID, subDistrictID});
    if (subDistrictData.length < 1) {
        console.log("No sub-districts found!")
        return;
    }
    // console.log(JSON.parse(JSON.stringify(subDistrictData)))
    let subDistrictAdminData = [];
    let index = 0;
    for (const singleSubDistrict of subDistrictData) {
        const generatedAdminDetails = generateAdminDetails(singleSubDistrict);
        await createSuperAdmin({
            name: generatedAdminDetails.username,
            email: `${generatedAdminDetails.username}@coronasafe.network`,
            phone: generatedAdminDetails.username,
            password: generatedAdminDetails.password,
            category: 2,
            clearence_level: 0,
            role: "super",
            district_restriction: null,
            plb_restriction: null,
            state: stateID
        });
        setTimeout(() => {
            console.log(index, generatedAdminDetails.username)
        }, 900);
        subDistrictAdminData.push({
            "No:": index + 1,
            "Panchayat/Municipality": singleSubDistrict.name,
            "District": singleSubDistrict.districtDetails.name,
            "Username": generatedAdminDetails.username,
            "Password": generatedAdminDetails.password,
        })
        index++;
    }
    // const subDistrictAdminData = await Promise.all(
    //     subDistrictData.map(async (singleSubDistrict, index) => {
    //         const generatedAdminDetails = generateAdminDetails(singleSubDistrict);
    //         await createSuperAdmin({
    //             name: generatedAdminDetails.username,
    //             email: `${generatedAdminDetails.username}@coronasafe.network`,
    //             phone: generatedAdminDetails.username,
    //             password: generatedAdminDetails.password,
    //             category: 2,
    //             clearence_level: 0,
    //             role: "super",
    //             district_restriction: null,
    //             plb_restriction: null,
    //             state: stateID
    //         });
    //         setTimeout(() => {
    //             console.log(index, generatedAdminDetails.username)
    //         }, 900);
    //         return {
    //             "No:": index + 1,
    //             "Panchayat/Municipality": singleSubDistrict.name,
    //             "District": singleSubDistrict.districtDetails.name,
    //             "Username": generatedAdminDetails.username,
    //             "Password": generatedAdminDetails.password,
    //         }
    //     })
    // )
    if (subDistrictAdminData.length === subDistrictData.length) {
        await convertJsonToCSV(subDistrictAdminData)
        return null;
    }
}

generateUsersBasedOnSubDistrict({
    // districtID: 6, //ID from district table
    // subDistrictID: 457, // //ID from plb table
    stateID: "ec42d1ff-db14-4299-8db7-a4acd9977783" // Kerala
}).then(r => {
    process.exit();
});

// Helper functions

function returnListOfSubDistricts({districtID, subDistrictID}) {
    try {
        let filter = {};
        if (subDistrictID) {
            filter.id = subDistrictID
        } else if (districtID) {
            filter.district = districtID;
        }
        return plbModel.findAll({
            where: filter || null,
            include: [{
                model: districtModel,
                as: "districtDetails",
                attributes: ['name'],
            }]
        });
    } catch (err) {
        console.log(`returnListOfSubDistricts - ${err.message}`)
        return err
    }
}

async function createSuperAdmin(userData) {
    try {
        // Delete if any duplicate resides
        await UserModel.destroy({
            where: {
                email: userData.email
            }
        });
        setTimeout(() => {
            console.log('inside delete',userData.password)
        }, 900);
        // Create a new user
        userData.password = await Commons.generatePasswordHash(userData.password);

        return UserModel.create(userData)
    } catch (err) {
        console.log(`createSuperAdmin - ${err.message}`)
        return err
    }
}

function generateAdminDetails(singleSubDistrictDetails) {
    // Generate username and password here
    const nameShortened = singleSubDistrictDetails.name.toLowerCase().substring(0, 4)

    const username = `pan${singleSubDistrictDetails.id}_${nameShortened}`
    const password = `${nameShortened}${Math.floor(Math.random() * 9000) + 1000}`

    return {
        username,
        password
    }
}

function convertJsonToCSV(inputJson) {
    return new Promise((resolve, reject) => {
        jsonExport(inputJson, (err, csv) => {
            if (err) {
                console.log(err)
                reject(err)
            }
            fs.writeFile(
                path.join(__dirname, `../credentials/credentials_${Number(new Date())}.csv`), csv, (err) => {
                    if (err) {
                        console.log(err)
                        reject(err)
                    }
                    console.log("\nFile Generated!")
                    resolve(true)
                });
        });
    })
}
