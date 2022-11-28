// SPDX-License-Identifier: MIT

pragma solidity >=0.8.17;

contract Enums {
    enum _UserClass {
        None,
        Admin,
        Teacher,
        Student
    }
    enum _StudentStatus {
        not_in_course_database,
        not_singed,
        signed,
        allowed,
        participant
    }
    enum _Marks {
        skipped,
        visited,
        two,
        three,
        four,
        five
    }
}

contract Structs is Enums {
    struct _Date {
        uint8 year;
        uint8 month;
        uint8 day;
    }
    struct _Lesson {
        _Marks[30] marks;
        address[30] students;
        uint256 amount_marks;
        _Date date;
    }
    struct _CourseStudentList {
        _StudentStatus course_access;
        address student;
        uint256 average;
    }
    struct _TimePair {
        uint8 hour;
        uint8 minute;
    }
    struct _TimeTable {
        _TimePair start;
        _TimePair end;
    }
    struct _Course {
        uint256 average;
        string name;
        _TimeTable[7] timetable;
        address teacher;
        _CourseStudentList[30] student_list;
        uint256 amount_students;
        _Lesson[30] lessons;
        uint256 amount_lessons;
    }
}

contract Constructor is Structs {
    constructor() {
        admin = msg.sender;
        users[admin] = _UserClass.Admin;
    }

    address public admin;
    mapping(address => _UserClass) public users;
    _Course[200] course_database;
    uint256 amount_courses = 0;
    mapping(string => uint256) course_name_id;
}

contract Modifiers is Constructor {
    modifier isAdmin() {
        require(
            users[msg.sender] == _UserClass.Admin,
            "You are not admin, you are not allowed to do that"
        );
        _;
    }
    modifier isTeacher(address teacher) {
        require(users[teacher] == _UserClass.Teacher, "You are not a teacher");
        _;
    }

    modifier isCourseTeacher(string memory course_name) {
        uint256 course_id = course_name_id[course_name];
        address teacher = course_database[course_id].teacher;
        require(
            msg.sender == teacher,
            "You are not the teacher of that course"
        );
        _;
    }

    modifier isStudent() {
        require(
            users[msg.sender] == _UserClass.Student,
            "You are not a student"
        );
        _;
    }

    modifier isNone(address user) {
        require(
            users[user] == _UserClass.None,
            "You dont have a role in the system"
        );
        _;
    }
}

contract CourseBinding is Enums, Structs, Modifiers {
    modifier isCourseStudent(string memory course_name, address student) {
        uint256 course_id = course_name_id[course_name];
        uint256 student_id = getStudentid(course_name, student);
        bool in_course = (course_database[course_id]
        .student_list[student_id]
        .course_access == _StudentStatus.participant);
        require(in_course, "This student is not in the course");
        _;
    }

    function addUser(address  new_user, _UserClass role)
    external
    isAdmin
    isNone(new_user)
    {
        users[new_user] = role;
    }

    function addCourse(string memory course_name) public isAdmin {
        course_database[amount_courses].name = course_name;
        amount_courses++;
    }

    function setTeacher(string memory course_name, address teacher)
    public
    isAdmin
    isTeacher(teacher)
    {
        course_database[course_name_id[course_name]].teacher = teacher;
    }

    function getStudentid(string memory course_name, address student)
    internal
    view
    returns (uint256)
    {
        uint256 course_id = course_name_id[course_name];
        for (
            uint256 i = 0;
            i < course_database[course_id].amount_students;
            i++
        ) {
            if (course_database[course_id].student_list[i].student == student) {
                return i;
            }
        }

        return 0;
    }

    function getStatus(address student, string memory course_name)
    public
    view
    returns (_StudentStatus value)
    {
        uint256 course_id = course_name_id[course_name];
        uint256 student_id = getStudentid(course_name, student);
        value = course_database[course_id]
        .student_list[student_id]
        .course_access;
    }

    function setStatus(
        address student,
        string memory course_name,
        _StudentStatus new_status
    ) internal {
        uint256 course_id = course_name_id[course_name];
        uint256 student_id = getStudentid(course_name, student);
        course_database[course_id]
        .student_list[student_id]
        .course_access = new_status;
    }

    function allowStudent(string memory course_name, address student)
    external
    isCourseTeacher(course_name)
    {
        _StudentStatus student_status = getStatus(student, course_name);
        require(
            student_status != _StudentStatus.participant,
            "Student is already in the course"
        );
        uint256 course_id = course_name_id[course_name];
        if (student_status == _StudentStatus.not_in_course_database) {
            _CourseStudentList memory new_student;
            new_student.student = student;
            new_student.average = 0;
            new_student.course_access = _StudentStatus.allowed;
            course_database[course_id].student_list[
            course_database[course_id].amount_students
            ] = new_student;
            course_database[course_id].amount_students;
        }
        if (student_status == _StudentStatus.signed) {
            setStatus(student, course_name, _StudentStatus.participant);
        }
    }

    function signUp(string memory course_name) external isStudent {
        uint256 course_id = course_name_id[course_name];
        _StudentStatus current_status = getStatus(msg.sender, course_name);
        require(
            current_status != _StudentStatus.participant,
            "Student is already in the course"
        );
        if (current_status == _StudentStatus.not_in_course_database) {
            _CourseStudentList memory new_student;
            new_student.student = msg.sender;
            new_student.average = 0;
            new_student.course_access = _StudentStatus.allowed;
            course_database[course_id].student_list[
            course_database[course_id].amount_students
            ] = new_student;
            course_database[course_id].amount_students;
        }
        if (current_status == _StudentStatus.allowed) {
            setStatus(msg.sender, course_name, _StudentStatus.participant);
        } else {
            setStatus(msg.sender, course_name, _StudentStatus.signed);
        }
    }
}

contract LessonEdit is Modifiers, CourseBinding {
    function addLesson(string memory course_name, _Date memory date)
    external
    isCourseTeacher(course_name)
    {
        uint256 course_id = course_name_id[course_name];
        course_database[course_id]
        .lessons[course_database[course_id].amount_lessons]
        .date
        .year = date.year;
        course_database[course_id]
        .lessons[course_database[course_id].amount_lessons]
        .date
        .month = date.month;
        course_database[course_id]
        .lessons[course_database[course_id].amount_lessons]
        .date
        .day = date.day;
        course_database[course_id].amount_lessons++;
    }

    function findLesson(string memory course_name, _Date memory date)
    internal
    view
    returns (int256)
    {
        uint256 course_id = course_name_id[course_name];
        for (
            uint256 i = 0;
            i < course_database[course_id].amount_lessons;
            i++
        ) {
            if (
                course_database[course_id].lessons[i].date.day == date.day &&
                course_database[course_id].lessons[i].date.month ==
                date.month &&
                course_database[course_id].lessons[i].date.year == date.year
            ) {
                return int256(i);
            }
        }
        return -1;
    }

    function setMarks(
        string memory course_name,
        _Date memory date,
        address student,
        _Marks mark
    )
    external
    isCourseTeacher(course_name)
    isCourseStudent(course_name, student)
    {
        uint256 course_id = course_name_id[course_name];
        int256 lesson_index_int = findLesson(course_name, date);
        if (lesson_index_int != -1) {
            uint256 lesson_index = uint256(lesson_index_int);
            course_database[course_id].lessons[lesson_index].students[
            course_database[course_id]
            .lessons[lesson_index]
            .amount_marks
            ] = student;
            course_database[course_id].lessons[lesson_index].marks[
            course_database[course_id].lessons[lesson_index].amount_marks
            ] = mark;
            course_database[course_id].lessons[lesson_index].amount_marks++;
        }
    }
}

contract GetMarks is Modifiers, CourseBinding, LessonEdit {
    event CourseMarks(
        string indexed course_name,
        _Date indexed date,
        address indexed student,
        _Marks mark
    );

    function getCourseMarksByDayByStudent(
        string memory course_name,
        _Date memory date,
        address student
    ) public isCourseStudent(course_name, student) {
        uint256 course_id = course_name_id[course_name];
        int256 lesson_index_int = findLesson(course_name, date);
        require((lesson_index_int > -1), "No lesson for that date and course");
        uint256 lesson_index = uint256(lesson_index_int);
        bool flag = false;
        for (
            uint256 i = 0;
            i < course_database[course_id].lessons[lesson_index].amount_marks;
            i++
        ) {
            if (
                course_database[course_id].lessons[lesson_index].students[i] ==
                student
            ) {
                emit CourseMarks(
                    course_name,
                    date,
                    course_database[course_id].lessons[lesson_index].students[
                    i
                    ],
                    course_database[course_id].lessons[lesson_index].marks[i]
                );
                flag = true;
            }
        }
        require(flag, "No student for that lesson");
    }

    function getFullCourseMarks(string memory course_name) public {
        uint256 course_id = course_name_id[course_name];
        for (
            uint256 i = 0;
            i < course_database[course_id].amount_lessons;
            i++
        ) {
            for (
                uint256 j = 0;
                j < course_database[course_id].lessons[i].amount_marks;
                j++
            ) {
                emit CourseMarks(
                    course_name,
                    course_database[course_id].lessons[i].date,
                    course_database[course_id].lessons[i].students[j],
                    course_database[course_id].lessons[i].marks[j]
                );
            }
        }
    }

    function getTeacherCourseMarks(address teacher) public isTeacher(teacher) {
        for (uint8 i = 0; i < amount_courses; i++) {
            if (course_database[i].teacher == teacher) {
                getFullCourseMarks(course_database[i].name);
            }
        }
    }

    function getStudentMarksByCourse(string memory course_name, address student)
    public
    isStudent
    isCourseStudent(course_name, student)
    {
        uint256 course_id = course_name_id[course_name];
        for (
            uint256 i = 0;
            i < course_database[course_id].amount_lessons;
            i++
        ) {
            for (
                uint256 k = 0;
                k < course_database[course_id].amount_lessons;
                k++
            ) {
                for (
                    uint256 z = 0;
                    z < course_database[course_id].lessons[k].amount_marks;
                    z++
                ) {
                    if (
                        course_database[course_id].lessons[k].students[z] ==
                        student
                    ) {
                        emit CourseMarks(
                            course_name,
                            course_database[course_id].lessons[k].date,
                            course_database[course_id].lessons[k].students[z],
                            course_database[course_id].lessons[k].marks[z]
                        );
                    }
                }
            }
        }
    }
}

contract Timetable is Modifiers {
    function setCourseTT(
        string memory course_name,
        uint8 day,
        _TimePair memory start,
        _TimePair memory end
    ) public isCourseTeacher(course_name) {
        uint256 course_id = course_name_id[course_name];
        course_database[course_id].timetable[(day - 1)].start.hour = start.hour;
        course_database[course_id].timetable[(day - 1)].start.minute = start
        .minute;
        course_database[course_id].timetable[(day - 1)].end.hour = end.hour;
        course_database[course_id].timetable[(day - 1)].end.minute = end.minute;
    }

    event CourseTimetable(string course_name, uint8 day, _TimeTable tt);

    function getCourseTTByDay(string memory course_name, uint8 day) public {
        uint256 course_id = course_name_id[course_name];
        emit CourseTimetable(
            course_name,
            day,
            course_database[course_id].timetable[day - 1]
        );
    }

    function getFullCourseTT(string memory course_name) public {
        for (uint8 j = 0; j < 7; j++) {
            getCourseTTByDay(course_name, j + 1);
        }
    }

    event CourseTimetablePerson(
        address indexed person,
        string indexed course_name,
        uint8 indexed day,
        _TimeTable tt
    );

    function getTeacherTT(address teacher) public isTeacher(msg.sender) {
        for (uint8 i = 0; i < amount_courses; i++) {
            if (course_database[i].teacher == teacher) {
                for (uint8 j = 0; j < 7; j++) {
                    emit CourseTimetablePerson(
                        teacher,
                        course_database[i].name,
                        j + 1,
                        course_database[i].timetable[j]
                    );
                }
            }
        }
    }

    function getStudentTT(address student) public isTeacher(msg.sender) {
        for (uint8 i = 0; i < amount_courses; i++) {
            for (uint8 j = 0; j < course_database[i].amount_students; j++) {
                if (
                    address(course_database[i].student_list[j].student) ==
                    student
                ) {
                    emit CourseTimetablePerson(
                        student,
                        course_database[i].name,
                        j + 1,
                        course_database[i].timetable[i]
                    );
                }
            }
        }
    }
}

contract StudySystem is
Enums,
Structs,
Modifiers,
Timetable,
CourseBinding,
LessonEdit,
GetMarks
{}
