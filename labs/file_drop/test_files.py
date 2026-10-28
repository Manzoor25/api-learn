from labs.file_drop.dropper import leave_partial, load_ready, publish, ready_files


def test_partial_file_is_ignored_until_done_marker(tmp_path):
    leave_partial(tmp_path, "orders.csv", "1,a\n2,b\n")
    assert ready_files(tmp_path) == []
    assert load_ready(tmp_path) == []
    publish(tmp_path, "orders.csv", "1,a\n2,b\n")
    assert [path.name for path in ready_files(tmp_path)] == ["orders.csv"]
    assert load_ready(tmp_path) == ["1,a", "2,b"]
