from main import department_prefix, normalize_semester


def test_normalize_semester_variants():
    cases = {
        "5": "5",
        5: "5",
        "Semester 5": "5",
        "Sem V": "5",
        "V": "5",
        "semester VIII": "8",
        "Sem-4": "4",
    }

    for value, expected in cases.items():
        assert normalize_semester(value) == expected


def test_department_prefix_variants():
    cases = {
        "Computer Science": "CS",
        "Computer Science & Engineering": "CS",
        "CSE": "CS",
        "Information Technology": "IT",
        "Electronics": "EC",
        "Electronics and Communication": "EC",
        "Mechanical": "ME",
        "Civil Engineering": "CE",
        "Electrical": "EE",
    }

    for value, expected in cases.items():
        assert department_prefix(value) == expected
