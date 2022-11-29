const {expect} = require("chai")
const {ethers} = require("hardhat")

describe("StudySystem", function () {
    let sysadmin
    let teacher1
    let teacher2
    let student1
    let student2
    let student3
    let student4

    let studysystem

    beforeEach(async function () {
        [sysadmin, teacher1, teacher2, student1, student2, student3, student4] = await ethers.getSigners()
        const StudySystem = await ethers.getContractFactory("StudySystem", sysadmin)
        studysystem = await StudySystem.deploy()
        await studysystem.deployed()
    })

    it("Contract has deployed", async function () {
        expect(studysystem.address).to.be.properAddress
        console.log("Deployed!")
    })

    it("Correct admin", async function () {
        expect(await studysystem.users(sysadmin.address)).to.equal(1);
    })

//Course binding
    it("Correct addUser role", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2);
        await studysystem.users(teacher1.address);
        expect(await studysystem.users(teacher1.address)).to.equal(2);
    })

    it("Correct addUser none role", async function () {
        await studysystem.connect(sysadmin).addUser(student1.address, 3);
        await studysystem.users(teacher1.address);
        expect(await studysystem.users(teacher1.address)).to.equal(0);
    })

    it("Correct addUser modifier", async function () {
        await expect(studysystem.connect(teacher1).addUser(student1.address, 3)).to.be.revertedWith("You are not admin, you are not allowed to do that");
    })

    it("Correct addUser role", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2);
        await studysystem.users(teacher1.address);
        expect(await studysystem.users(teacher1.address)).to.equal(2);
    })

    it("Correct addCourse and setTeacher", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 1)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        const second = "Algebra"
        await studysystem.connect(sysadmin).addCourse(second)
        let course_name = await studysystem.course_database(0)
        expect(course_name.name).to.be.equal(first)
        let ss = await studysystem.course_database(0)
        expect(ss.name).to.be.equal(first)
    })

    it("setTeacher", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 1)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        let course_name = await studysystem.course_database(0)
        expect(course_name.name).to.be.equal(first)
        expect(course_name.teacher).to.be.equal(teacher1.address)
    })

    it("Correct isCourseTeacher modifier", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 1)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        expect(studysystem.connect(sysadmin).allowStudent(first, student1.address)).to.be.reverted
    })

    it("Correct isCourseStudent modifier", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(student1).signUp(first)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        expect(studysystem.connect(student1).allowStudent(first, student1.address)).to.be.reverted
    })

    it("Correct getStatus function", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(student1).signUp(first)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        expect(await studysystem.connect(teacher1).getStatus(first, student1.address)).to.be.equal(4)
    })

    it("Correct allow and signup module", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)

        await studysystem.connect(student1).signUp(first)
        expect(await studysystem.connect(teacher1).getStatus(first, student1.address)).to.be.equal(2)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)

        expect(await studysystem.connect(teacher1).getStatus(first, student2.address)).to.be.equal(0)
        await studysystem.connect(teacher1).allowStudent(first, student2.address)
        expect(await studysystem.connect(teacher1).getStatus(first, student2.address)).to.be.equal(3)
        await studysystem.connect(student2).signUp(first)
        expect(await studysystem.connect(teacher1).getStatus(first, student2.address)).to.be.equal(4)

        expect(studysystem.connect(teacher1).allowStudent(first, student1.address)).to.be.reverted
        expect(studysystem.connect(student1).signUp(first, student1.address)).to.be.reverted
        expect(studysystem.connect(student2).signUp(first, student1.address)).to.be.reverted

        expect(await studysystem.connect(teacher1).getStatus(first, student1.address)).to.be.equal(4)
    })


    it("Correct addLesson and findLesson functions", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(student1).signUp(first)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 30])
        expect(await studysystem.findLesson(first, [22, 1, 30])).to.be.equal(0)
        expect(await studysystem.findLesson(first, [22, 1, 20])).to.be.equal(-1)
        expect(await studysystem.findLesson(first, [22, 1, 40])).to.be.reverted
    })

    it("Correct setMarks and getMarksByDayByStudent", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(student1).signUp(first)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 1])
        await studysystem.connect(teacher1).setMarks(first, [22, 1, 1], student1.address, 5)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 2])
        expect(await studysystem.getCourseMarksByDayByStudent(first,[22,1,1], student1.address)).to.emit(studysystem,"CourseMarks").withArgs(first, [22,1,1], student1.address, 5)
        expect(await studysystem.getCourseMarksByDayByStudent(first,[22,1,1], student1.address)).to.emit(studysystem,"CourseMarks").withArgs(first, [22,1,1], student1.address, 5)
    })

    it("Correct FullCourseMarks", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(student1).signUp(first)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 1])
        await studysystem.connect(teacher1).setMarks(first, [22, 1, 1], student1.address, 5)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 2])
        await studysystem.connect(teacher1).setMarks(first, [22, 1, 2], student1.address, 4)
        expect(await studysystem.getFullCourseMarks(first)).to.emit(studysystem,"CourseMarks").withArgs(first, [22,1,1], student1.address, 5)
        expect(await studysystem.getFullCourseMarks(first)).to.emit(studysystem,"CourseMarks").withArgs(first, [22,1,2],  student1.address, 4)
    })

    it("Correct getTeacherCourseMarks", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(teacher2.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(student1).signUp(first)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 1])
        await studysystem.connect(teacher1).setMarks(first, [22, 1, 1], student1.address, 5)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 2])
        await studysystem.connect(teacher1).setMarks(first, [22, 1, 2], student1.address, 4)
        expect(await studysystem.getTeacherCourseMarks(teacher1.address)).to.emit(studysystem,"CourseMarks").withArgs(first, [22,1,1], student1.address, 5)
        expect(await studysystem.getTeacherCourseMarks(teacher1.address)).to.emit(studysystem,"CourseMarks").withArgs(first, [22,1,2],  student1.address, 4)

        const second = "Algebra"
        await studysystem.connect(sysadmin).addCourse(second)
        await studysystem.connect(sysadmin).setTeacher(second, teacher2.address)

        await studysystem.connect(teacher2).allowStudent(second, student1.address)
        await studysystem.connect(student1).signUp(second)

        await studysystem.connect(teacher2).addLesson(second, [21, 11, 1])
        await studysystem.connect(teacher2).setMarks(second, [21, 11, 1], student1.address, 3)
        await studysystem.connect(teacher2).addLesson(second, [21, 11, 2])
        await studysystem.connect(teacher2).setMarks(second, [21, 11, 2], student1.address, 3)
        expect(await studysystem.getTeacherCourseMarks(teacher2.address)).to.emit(studysystem,"CourseMarks").withArgs(second, [21, 11,,1], student1.address, 3)
        expect(await studysystem.getTeacherCourseMarks(teacher2.address)).to.emit(studysystem,"CourseMarks").withArgs(second, [21, 11,,2],  student1.address, 3)
    })


    it("Correct getStudentsMarksByCourse", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(teacher2.address, 2)
        await studysystem.connect(sysadmin).addUser(student1.address, 3)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher1.address)
        await studysystem.connect(student1).signUp(first)
        await studysystem.connect(teacher1).allowStudent(first, student1.address)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 1])
        await studysystem.connect(teacher1).setMarks(first, [22, 1, 1], student1.address, 5)
        await studysystem.connect(teacher1).addLesson(first, [22, 1, 2])
        await studysystem.connect(teacher1).setMarks(first, [22, 1, 2], student1.address, 4)

        const second = "Algebra"
        await studysystem.connect(sysadmin).addCourse(second)
        await studysystem.connect(sysadmin).setTeacher(second, teacher2.address)

        await studysystem.connect(teacher2).allowStudent(second, student1.address)
        await studysystem.connect(student1).signUp(second)

        await studysystem.connect(teacher2).addLesson(second, [21, 11, 1])
        await studysystem.connect(teacher2).setMarks(second, [21, 11, 1], student1.address, 3)
        expect(await studysystem.connect(student2).getStudentMarksByCourse(second,student1.address)).to.emit(studysystem,"CourseMarks").withArgs(second, [21, 11,,1], student1.address, 3)

    })

    it("Correct setCourseTT and getCourseTTByDay", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(teacher2.address, 2)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher2.address)
        await studysystem.connect(teacher2).setCourseTT(first,1,[18,10],[20,0])
        await studysystem.connect(teacher2).getCourseTTByDay(first,1)
        expect(await studysystem.connect(teacher2).getCourseTTByDay(first,1)).to.emit(studysystem,"CourseTimetable").withArgs(first, 1,[[18,10],[20,0]])
    })

    it("Correct getFullCourseTT", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(teacher2.address, 2)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher2.address)
        await studysystem.connect(teacher2).setCourseTT(first,1,[18,10],[20,1])
        await studysystem.connect(teacher2).setCourseTT(first,2,[18,10],[20,2])
        await studysystem.connect(teacher2).setCourseTT(first,3,[18,10],[20,3])
        await studysystem.connect(teacher2).setCourseTT(first,4,[18,10],[20,4])
        await studysystem.connect(teacher2).setCourseTT(first,5,[18,10],[20,5])
        await studysystem.connect(teacher2).setCourseTT(first,6,[18,10],[20,6])
        await studysystem.connect(teacher2).setCourseTT(first,7,[18,10],[20,7])
        expect(await studysystem.connect(teacher2).getFullCourseTT(first)).to.emit(studysystem,"CourseTimetable").withArgs(first, 1,[[18,10],[20,1]])
        expect(await studysystem.connect(teacher2).getFullCourseTT(first)).to.emit(studysystem,"CourseTimetable").withArgs(first, 2,[[18,10],[20,2]])
        expect(await studysystem.connect(teacher2).getFullCourseTT(first)).to.emit(studysystem,"CourseTimetable").withArgs(first, 3,[[18,10],[20,3]])
        expect(await studysystem.connect(teacher2).getFullCourseTT(first)).to.emit(studysystem,"CourseTimetable").withArgs(first, 4,[[18,10],[20,4]])
        expect(await studysystem.connect(teacher2).getFullCourseTT(first)).to.emit(studysystem,"CourseTimetable").withArgs(first, 5,[[18,10],[20,5]])
        expect(await studysystem.connect(teacher2).getFullCourseTT(first)).to.emit(studysystem,"CourseTimetable").withArgs(first, 6,[[18,10],[20,6]])
        expect(await studysystem.connect(teacher2).getFullCourseTT(first)).to.emit(studysystem,"CourseTimetable").withArgs(first, 7,[[18,10],[20,7]])

    })

    it("Correct getTeacherTT", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(teacher2.address, 2)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher2.address)
        await studysystem.connect(teacher2).setCourseTT(first,1,[18,10],[20,1])
        await studysystem.connect(teacher2).setCourseTT(first,2,[18,10],[20,2])
        await studysystem.connect(teacher2).setCourseTT(first,3,[18,10],[20,3])
        await studysystem.connect(teacher2).setCourseTT(first,4,[18,10],[20,4])
        await studysystem.connect(teacher2).setCourseTT(first,5,[18,10],[20,5])
        await studysystem.connect(teacher2).setCourseTT(first,6,[18,10],[20,6])
        await studysystem.connect(teacher2).setCourseTT(first,7,[18,10],[20,7])
        expect(await studysystem.connect(teacher2).getTeacherTT(teacher2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 1,[[18,10],[20,1]])
        expect(await studysystem.connect(teacher2).getTeacherTT(teacher2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 2,[[18,10],[20,2]])
        expect(await studysystem.connect(teacher2).getTeacherTT(teacher2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 3,[[18,10],[20,3]])
        expect(await studysystem.connect(teacher2).getTeacherTT(teacher2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 4,[[18,10],[20,4]])
        expect(await studysystem.connect(teacher2).getTeacherTT(teacher2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 5,[[18,10],[20,5]])
        expect(await studysystem.connect(teacher2).getTeacherTT(teacher2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 6,[[18,10],[20,6]])
        expect(await studysystem.connect(teacher2).getTeacherTT(teacher2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 7,[[18,10],[20,7]])

    })

    it("Correct getStudentTT", async function () {
        await studysystem.connect(sysadmin).addUser(teacher1.address, 2)
        await studysystem.connect(sysadmin).addUser(teacher2.address, 2)
        await studysystem.connect(sysadmin).addUser(student2.address, 3)
        const first = "Integral"
        await studysystem.connect(sysadmin).addCourse(first)
        await studysystem.connect(sysadmin).setTeacher(first, teacher2.address)

        await studysystem.connect(teacher2).allowStudent(first, student2.address)
        await studysystem.connect(student2).signUp(first)

        await studysystem.connect(teacher2).setCourseTT(first,1,[18,10],[20,1])
        await studysystem.connect(teacher2).setCourseTT(first,2,[18,10],[20,2])
        await studysystem.connect(teacher2).setCourseTT(first,3,[18,10],[20,3])
        await studysystem.connect(teacher2).setCourseTT(first,4,[18,10],[20,4])
        await studysystem.connect(teacher2).setCourseTT(first,5,[18,10],[20,5])
        await studysystem.connect(teacher2).setCourseTT(first,6,[18,10],[20,6])
        await studysystem.connect(teacher2).setCourseTT(first,7,[18,10],[20,7])
        expect(await studysystem.connect(student2).getStudentTT(student2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 1,[[18,10],[20,1]])
        expect(await studysystem.connect(student2).getStudentTT(student2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 2,[[18,10],[20,2]])
        expect(await studysystem.connect(student2).getStudentTT(student2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 3,[[18,10],[20,3]])
        expect(await studysystem.connect(student2).getStudentTT(student2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 4,[[18,10],[20,4]])
        expect(await studysystem.connect(student2).getStudentTT(student2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 5,[[18,10],[20,5]])
        expect(await studysystem.connect(student2).getStudentTT(student2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 6,[[18,10],[20,6]])
        expect(await studysystem.connect(student2).getStudentTT(student2.address)).to.emit(studysystem,"CourseTimetable").withArgs(first, 7,[[18,10],[20,7]])

    })
})