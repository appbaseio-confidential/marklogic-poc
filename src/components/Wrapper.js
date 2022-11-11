import { ReactiveBase, SelectedFilters } from "@appbaseio/reactivesearch";
import { Tabs } from "antd";
import React, { useEffect, useState } from "react";
import CollectionDropdown from "./CollectionDropdown";
import Facet from "./Facet";
import Results from "./Results";
import Search from "./Search";
import TableLayout from "./TableLayout";

const Wrapper = () => {
  const [mlMode, setMlMode] = useState("search");
  const [mlCollection, setMlCollection] = useState("Member");
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    handleTabChange(mlMode);
  }, []);

  const handleTabChange = (key) => {
    setMlMode(key);
  };

  const handleMlCollection = (key) => {
    setMlCollection(key);
  };

  const getURL = () => {
    let str =
      "https://sls-marklogic-mhtrceb-arc.searchbase.io/_marklogic/_reactivesearch";
    let query = "";
    if (mlCollection && mlMode) {
      query += `ml__collection=${mlCollection}&ml__mode=${mlMode}`;
    } else if (mlMode || mlCollection) {
      if (mlMode) query += `ml__mode=${mlMode}`;
      if (mlCollection) query += `ml__collection=${mlCollection}`;
    }
    if (query) return `${str}?${query}`;

    return str;
  };

  return (
    <div key={`${mlMode}-${mlCollection}`}>
      <ReactiveBase
        app="_marklogic"
        url="https://sls-marklogic-mhtrceb-arc.searchbase.io"
        credentials="2vhVRi0Oxf:ADyzknt5fY5FLmWcVK"
        enableAppbase
        transformRequest={(props) => {
          const newBody = JSON.parse(
            // eslint-disable-next-line
            props.body
          );
          const newQuery = newBody.query.map((ele) => {
            if (ele.id === "search" && ele.type === "search") {
              // const newEle = {};
              // newEle.id = ele.id;
              // newEle.value = ele.value || "";
              // if (ele.dataField) newEle.dataField = ele.dataField;

              const newEle = { ...ele };
              // type sugegstion is not supported
              newEle.type = "search";
              // delete newEle.type;
              return newEle;
            }
            return ele;
          });
          newBody.query = newQuery;
          // eslint-disable-next-line
          props.body = JSON.stringify(newBody);
          if (mlMode === "search") props.url = getURL();
          else {
            let str =
              "https://sls-marklogic-mhtrceb-arc.searchbase.io/_marklogic/_reactivesearch";
            props.url = `${str}?ml__mode=${mlMode}`;
          }

          return props;
        }}
      >
        <div
          style={{
            padding: 30,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <Tabs
            defaultActiveKey="search"
            activeKey={mlMode}
            onChange={handleTabChange}
          >
            <Tabs.TabPane tab="/vi1/Search" key="search">
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
                  <CollectionDropdown
                    mlCollection={mlCollection}
                    setMlCollection={handleMlCollection}
                  />
                  <Search inputVal={inputVal} setInputVal={setInputVal} />
                </div>

                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ width: "18%", minWidth: 220 }}>
                    <Facet />
                  </div>
                  <SelectedFilters />
                  <Results />
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="SPARQL" key="sparql">
              <div>
                <Search inputVal={inputVal} setInputVal={setInputVal} />
                <Results />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Optic" key="optic">
              <Search inputVal={inputVal} setInputVal={setInputVal} />
              <TableLayout />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </ReactiveBase>
    </div>
  );
};

export default Wrapper;
