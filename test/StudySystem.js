const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("StudySystem", function () {
  let sysadmin
  let teacher1
  let teacher2
  let student1
  let student2
  let student3
  let student4

  let studysystem

  beforeEach(async function() {
    [sysadmin, teacher1, teacher2, student1, student2, student3, student4] = await ethers.getSigners()
    const StudySystem = await ethers.getContractFactory("StudySystem", sysadmin)
    studysystem = await StudySystem.deploy()
    await studysystem.deployed()
  })

  it("Contract has deployed", async function() {
    expect(studysystem.address).to.be.properAddress
    console.log("Deployed!")
  })

  it("Correct admin", async function() {
    expect( await studysystem.users(sysadmin.address)).to.equal(1);
  })

//Course binding
  it("Correct addUser role", async function() {
    await studysystem.connect(sysadmin).addUser(teacher1.address, 2);
    await studysystem.users(teacher1.address);
    expect( await studysystem.users(teacher1.address)).to.equal(2);
  })

  it("Correct addUser none role", async function() {
    await studysystem.connect(sysadmin).addUser(student1.address, 3);
    await studysystem.users(teacher1.address);
    expect( await studysystem.users(teacher1.address)).to.equal(0);
  })

  it("Correct addUser modifier", async function() {
    await expect(studysystem.connect(teacher1).addUser(student1.address, 3)).to.be.revertedWith("You are not admin, you are not allowed to do that");
  })

  it("Correct addUser role", async function() {
    await studysystem.connect(sysadmin).addUser(teacher1.address, 2);
    await studysystem.users(teacher1.address);
    expect( await studysystem.users(teacher1.address)).to.equal(2);
  })

  it("Correct addCourse", async function() {
    await studysystem.connect(sysadmin).addUser(teacher1.address, 2);
    const first = "Integral"
    expect(await studysystem.course_database[0].name).to.be(first)
  })

  it("Correct set teacher", async function() {
    await studysystem.connect(sysadmin).addUser(teacher1.address, 2);
    const first = "Integral"
    await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
    await studysystem.course_database[0].teacher
    expect(await studysystem.course_database(0).teacher).to.be(first)
  })


})