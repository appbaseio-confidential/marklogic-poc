import { ReactiveBase, ReactiveComponent } from "@appbaseio/reactivesearch";
import { Tabs } from "antd";
import get from "lodash.get";
import React, { useEffect, useState } from "react";
import CollectionDropdown from "./CollectionDropdown";
import Facet from "./Facet";
import SearchResults from "./SearchResults";
import Search from "./Search";
import TableLayout from "./TableLayout";
import SparqlResults from "./SparqlResults";

const Wrapper = () => {
  const [mlMode, setMlMode] = useState("search");
  const [mlCollection, setMlCollection] = useState("Member");
  const [inputVal, setInputVal] = useState("");
  const [searchHits, setSearchHits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hitsCount, setHitsCount] = useState(0);

  useEffect(() => {
    handleTabChange(mlMode);
  }, []);

  const handleTabChange = (key) => {
    setInputVal("");
    setMlMode(key);
  };

  const handleMlCollection = (key) => {
    setMlCollection(key);
  };

  const ML_URL = "https://test-sls-instance-wjictry-arc.searchbase.io";
  const ML_CREDS = "e901c566e571:f5a72c51-193b-4cc5-bad1-0a308339cf2f";

  const getURL = () => {
    let str =
      `${ML_URL}/_marklogic/_reactivesearch`;
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
    <div key={`${mlMode}-${mlCollection}-${inputVal}`}>
      <ReactiveBase
        app="_marklogic"
        url={ML_URL}
        credentials={ML_CREDS}
        enableAppbase
        transformRequest={(props) => {
          setIsLoading(true);
          const newBody = JSON.parse(props.body);
          const termQuery = newBody.query.filter(
            (i) => i.type === "term" && i.id === "term"
          );

          const newQuery = [
            ...(mlMode === "search" ? newBody.query : []),
            {
              id: "search",
              value: inputVal,
              execute: true,
              ...(termQuery && termQuery[0] && termQuery[0].value
                ? { react: { and: ["term"] } }
                : {}),
            },
          ];
          newBody.query = newQuery;
          props.body = JSON.stringify(newBody);
          if (mlMode === "search") props.url = getURL();
          else {
            let str =
              `${ML_URL}/_marklogic/_reactivesearch`;
            props.url = `${str}?ml__mode=${mlMode}`;
          }

          return props;
        }}
        transformResponse={async (elasticsearchResponse, componentId) => {
          if (componentId === "search") {
            const hits = elasticsearchResponse?.hits?.hits || [];
            const totHitsCount = elasticsearchResponse?.hits?.total?.value || 0;
            setHitsCount(totHitsCount);
            const newHits = hits.map((hit) => {
              if (mlMode === "search") {
                const content = get(hit, "_source.extracted.content", [{}]);
                const contentObj = content[0];
                if (contentObj && Object.values(contentObj).length) {
                  return Object.values(contentObj)[0];
                }
                return {};
              }
              const content = get(hit, "_source", {});
              return content;
            });
            setSearchHits(newHits);
          }
          setIsLoading(false);
          return elasticsearchResponse;
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
          <ReactiveComponent
            componentId="search"
            defaultQuery={() => ({
              aggs: {},
            })}
            react={{ and: ["term"] }}
          />
          <Tabs
            defaultActiveKey="search"
            activeKey={mlMode}
            onChange={handleTabChange}
          >
            <Tabs.TabPane tab="/v1/Search" key="search">
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
                  <SearchResults
                    hitsCount={hitsCount}
                    searchHits={searchHits}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="SPARQL" key="sparql">
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 30 }}>
                  <Search inputVal={inputVal} setInputVal={setInputVal} />
                </div>

                <SparqlResults
                  searchHits={searchHits}
                  isLoading={isLoading}
                  hitsCount={hitsCount}
                />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Optic" key="optic">
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 30 }}>
                  <Search inputVal={inputVal} setInputVal={setInputVal} />
                </div>

                <TableLayout
                  searchHits={searchHits}
                  isLoading={isLoading}
                  hitsCount={hitsCount}
                />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </ReactiveBase>
    </div>
  );
};

export default Wrapper;
