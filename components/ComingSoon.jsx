export default function ComingSoon({ icon, en, ar, descEn, descAr }) {
  return (
    <div className="page">
      <div className="coming">
        <span className="ic"><i className={'ti ' + icon} /></span>
        <h2 data-ar={ar}>{en}</h2>
        <p data-ar={descAr}>{descEn}</p>
      </div>
    </div>
  );
}
