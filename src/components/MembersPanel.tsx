import { useMemo, useState } from 'react';
import type { UseTimecard } from '../hooks/useTimecard';
import {
  BUREAU_DEPARTMENTS,
  BUREAUS,
  CLASSES,
  GRADES,
  OTHER_DEPARTMENT,
  ROLES,
  type Bureau,
  type Grade,
  type Role,
} from '../types';

interface MembersPanelProps {
  tc: UseTimecard;
}

const formatAffiliation = (bureau?: string, department?: string): string =>
  [bureau, department].filter(Boolean).join(' ');

const formatGradeClass = (grade?: string, classroom?: string): string =>
  [grade, classroom].filter(Boolean).join(' ');

export function MembersPanel({ tc }: MembersPanelProps) {
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [classroom, setClassroom] = useState('');
  const [role, setRole] = useState<Role>('役員');
  const [bureau, setBureau] = useState<Bureau | ''>('');
  const [departmentChoice, setDepartmentChoice] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [search, setSearch] = useState('');

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tc.members;
    return tc.members.filter((m) => {
      const haystack = [
        m.name,
        m.furigana,
        m.grade,
        m.classroom,
        m.role,
        m.bureau,
        m.department,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tc.members, search]);

  const departmentOptions = useMemo(() => {
    if (!bureau) return [] as string[];
    const defined = BUREAU_DEPARTMENTS[bureau];
    if (defined.length === 0) return [];
    return [...defined, OTHER_DEPARTMENT];
  }, [bureau]);

  const hasDepartmentSelection = !bureau || departmentOptions.length > 0;

  const handleBureauChange = (next: string) => {
    setBureau(next as Bureau | '');
    setDepartmentChoice('');
    setCustomDepartment('');
  };

  const resolvedDepartment = (): string => {
    if (!departmentChoice) return '';
    if (departmentChoice === OTHER_DEPARTMENT) {
      return customDepartment.trim() || OTHER_DEPARTMENT;
    }
    return departmentChoice;
  };

  const submit = () => {
    const error = tc.addMember({
      name,
      furigana,
      grade,
      classroom,
      role,
      bureau: bureau || undefined,
      department: resolvedDepartment(),
    });
    if (error) {
      window.alert(error);
      return;
    }
    setName('');
    setFurigana('');
    setGrade('');
    setClassroom('');
    setRole('役員');
    setBureau('');
    setDepartmentChoice('');
    setCustomDepartment('');
  };

  const handleDelete = (id: number, memberName: string) => {
    if (
      window.confirm(
        `「${memberName}」を削除します。打刻履歴はそのまま残ります。よろしいですか?`
      )
    ) {
      tc.deleteMember(id);
    }
  };

  const onEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
  };

  const showCustomInput = departmentChoice === OTHER_DEPARTMENT;

  return (
    <>
      <div className="card">
        <h2>メンバー追加</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="名前(漢字)"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onEnterSubmit}
          />
          <input
            type="text"
            placeholder="ふりがな(例: やまだたろう)※任意"
            maxLength={40}
            value={furigana}
            onChange={(e) => setFurigana(e.target.value)}
            onKeyDown={onEnterSubmit}
          />
        </div>
        <div className="form-row">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as Grade | '')}
          >
            <option value="">学年を選択(任意)</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            <option value="">クラスを選択(任意)</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <select value={bureau} onChange={(e) => handleBureauChange(e.target.value)}>
            <option value="">局を選択(任意)</option>
            {BUREAUS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {hasDepartmentSelection && (
            <select
              value={departmentChoice}
              onChange={(e) => setDepartmentChoice(e.target.value)}
              disabled={!bureau}
            >
              <option value="">{bureau ? '部を選択(任意)' : '先に局を選択'}</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
          {showCustomInput && (
            <input
              type="text"
              placeholder="部の名前を入力"
              maxLength={20}
              value={customDepartment}
              onChange={(e) => setCustomDepartment(e.target.value)}
              onKeyDown={onEnterSubmit}
            />
          )}
          <button className="btn btn-primary" onClick={submit}>
            追加
          </button>
        </div>
        <div className="form-hint">
          名前以外は任意です。「その他」を選ぶと部の名前を自由入力できます。
        </div>
      </div>
      <div className="card">
        <h2>登録済みメンバー</h2>
        {tc.members.length === 0 ? (
          <div className="empty">登録されていません</div>
        ) : (
          <>
            <div className="toolbar">
              <input
                type="text"
                placeholder="検索 (名前 / ふりがな / 学年 / クラス / 役職 / 局 / 部)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSearch('')}
                >
                  クリア
                </button>
              )}
              <div className="spacer" />
              <span className="muted" style={{ fontSize: 13 }}>
                {search
                  ? `${filteredMembers.length} / ${tc.members.length} 件`
                  : `${tc.members.length} 件`}
              </span>
            </div>
            {filteredMembers.length === 0 ? (
              <div className="empty">該当するメンバーがいません</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>学年・クラス</th>
                    <th>役職</th>
                    <th>所属</th>
                    <th>状態</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => {
                const isWorking = !!tc.openRecordOf(m.id);
                const affiliation = formatAffiliation(m.bureau, m.department);
                const gradeClass = formatGradeClass(m.grade, m.classroom);
                return (
                  <tr key={m.id}>
                    <td>
                      <div>{m.name}</div>
                      {m.furigana && (
                        <div className="furigana">{m.furigana}</div>
                      )}
                    </td>
                    <td>{gradeClass || <span className="muted">―</span>}</td>
                    <td>{m.role}</td>
                    <td>{affiliation || <span className="muted">―</span>}</td>
                    <td>
                      <span className={`status ${isWorking ? 'in' : 'out'}`}>
                        {isWorking ? '在室中' : '不在'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDelete(m.id, m.name)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </>
  );
}
